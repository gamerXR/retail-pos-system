import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { posDB } from "../pos/db";

export interface LoginRequest {
  phoneNumber: string; // This is the phoneId for licensed users
  password: string;
  licenseKey?: string; // Optional. If not provided, it's a trial login attempt.
  deviceId?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  userType: "licensed" | "trial" | "expired";
  trialTimeRemaining?: number; // in minutes
  licenseInfo?: {
    clientName: string;
    company: string;
    expiresAt?: string;
  };
  isFirstLogin?: boolean; // Indicates if this is the first login for a licensed user
}

// Authenticates user with phone number, password, and optional license key.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    // If license key is provided, it's a licensed user login attempt.
    if (req.licenseKey) {
      const license = await authDB.queryRow<{
        id: number;
        phone_id: string;
        client_name: string;
        company_name: string;
        is_active: boolean;
        expires_at: Date | null;
        password_hash: string;
        created_at: Date;
      }>`
        SELECT id, phone_id, client_name, company_name, is_active, expires_at, password_hash, created_at
        FROM licenses 
        WHERE license_key = ${req.licenseKey} AND phone_id = ${req.phoneNumber}
      `;

      if (!license) {
        throw APIError.unauthenticated("Invalid license key or phone ID");
      }

      // FIXME: Use bcrypt.compare in a real application.
      const passwordMatch = req.password === license.password_hash;
      if (!passwordMatch) {
        throw APIError.unauthenticated("Invalid password");
      }

      if (!license.is_active) {
        throw APIError.unauthenticated("License has been deactivated");
      }

      if (license.expires_at && new Date() > license.expires_at) {
        throw APIError.unauthenticated("License has expired");
      }

      // Check if this is the first login (within 5 minutes of license creation)
      const now = new Date();
      const createdAt = new Date(license.created_at);
      const timeDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60); // difference in minutes
      const isFirstLogin = timeDiff <= 5;

      // If this is a first login for a licensed user, clear default data
      if (isFirstLogin) {
        try {
          // Clear default categories and products for new licensed users
          await clearDefaultDataForNewUser();
        } catch (error) {
          console.error("Error clearing default data for new user:", error);
          // Don't fail the login if clearing data fails, just log the error
        }
      }

      return {
        success: true,
        message: "Licensed login successful",
        userType: "licensed",
        licenseInfo: {
          clientName: license.client_name,
          company: license.company_name || "",
          expiresAt: license.expires_at?.toISOString()
        },
        isFirstLogin
      };
    }

    // No license key provided - handle trial mode
    if (req.phoneNumber === "admin" && req.password === "123") {
        if (!req.deviceId) {
          throw APIError.invalidArgument("Device ID is required for trial mode");
        }
        
        // Check existing trial session
        const existingTrial = await authDB.queryRow<{
          id: number;
          expires_at: Date;
          is_active: boolean;
        }>`
          SELECT id, expires_at, is_active
          FROM trial_sessions 
          WHERE device_id = ${req.deviceId}
        `;

        if (existingTrial) {
          if (!existingTrial.is_active) {
            throw APIError.unauthenticated("Trial period has ended. Please contact administrator for a license key.");
          }

          const now = new Date();
          if (now > existingTrial.expires_at) {
            // Trial expired, deactivate it
            await authDB.exec`
              UPDATE trial_sessions 
              SET is_active = FALSE 
              WHERE device_id = ${req.deviceId}
            `;
            throw APIError.unauthenticated("Trial period has ended. Please contact administrator for a license key.");
          }

          // Trial still active
          const timeRemaining = Math.ceil((existingTrial.expires_at.getTime() - now.getTime()) / (1000 * 60));
          return {
            success: true,
            message: "Trial login successful",
            userType: "trial",
            trialTimeRemaining: timeRemaining
          };
        }

        // Create new trial session
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
        await authDB.exec`
          INSERT INTO trial_sessions (device_id, expires_at)
          VALUES (${req.deviceId}, ${expiresAt})
        `;

        return {
          success: true,
          message: "Trial started - 30 minutes remaining",
          userType: "trial",
          trialTimeRemaining: 30
        };
    }

    // If it's not a trial login and not a valid licensed login, fail.
    throw APIError.unauthenticated("Invalid credentials or license key required");
  }
);

// Helper function to clear default data for new licensed users
async function clearDefaultDataForNewUser() {
  try {
    // Start a transaction to ensure data consistency
    const tx = await posDB.begin();
    
    try {
      // Delete all existing products first (due to foreign key constraints)
      await tx.exec`DELETE FROM products`;
      
      // Delete all existing categories
      await tx.exec`DELETE FROM categories`;
      
      // Commit the transaction
      await tx.commit();
      
      console.log("Successfully cleared default data for new licensed user");
    } catch (error) {
      // Rollback the transaction if there's an error
      await tx.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error clearing default data:", error);
    throw error;
  }
}

export interface CheckTrialRequest {
  deviceId: string;
}

export interface CheckTrialResponse {
  isActive: boolean;
  timeRemaining?: number; // in minutes
  message: string;
}

// Checks trial session status.
export const checkTrial = api<CheckTrialRequest, CheckTrialResponse>(
  { expose: true, method: "POST", path: "/auth/check-trial" },
  async (req) => {
    const trial = await authDB.queryRow<{
      expires_at: Date;
      is_active: boolean;
    }>`
      SELECT expires_at, is_active
      FROM trial_sessions 
      WHERE device_id = ${req.deviceId}
    `;

    if (!trial || !trial.is_active) {
      return {
        isActive: false,
        message: "No active trial session found"
      };
    }

    const now = new Date();
    if (now > trial.expires_at) {
      // Trial expired, deactivate it
      await authDB.exec`
        UPDATE trial_sessions 
        SET is_active = FALSE 
        WHERE device_id = ${req.deviceId}
      `;
      return {
        isActive: false,
        message: "Trial period has expired"
      };
    }

    const timeRemaining = Math.ceil((trial.expires_at.getTime() - now.getTime()) / (1000 * 60));
    return {
      isActive: true,
      timeRemaining,
      message: `${timeRemaining} minutes remaining`
    };
  }
);
