import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  token: string;
}

export interface CreateLicenseRequest {
  phoneId: string;
  clientName: string;
  password: string;
  email?: string;
  companyName?: string;
  expiresAt?: string; // ISO date string, optional for permanent license
}

export interface License {
  id: number;
  licenseKey: string;
  phoneId: string;
  clientName: string;
  email?: string;
  companyName?: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateLicenseResponse {
  license: License;
  success: boolean;
}

export interface ListLicensesResponse {
  licenses: License[];
  total: number;
}

export interface TrialSession {
  id: number;
  deviceId: string;
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
  timeRemaining?: number;
}

export interface ListTrialSessionsResponse {
  sessions: TrialSession[];
  total: number;
}

// Admin login endpoint.
export const adminLogin = api<AdminLoginRequest, AdminLoginResponse>(
  { auth: false, expose: true, method: "POST", path: "/auth/admin/login" },
  async (req) => {
    if (req.username === "6737165617" && req.password === "12345678") {
      return {
        success: true,
        message: "Super admin login successful",
        token: "admin-token-" + Date.now()
      };
    }

    throw APIError.unauthenticated("Invalid super admin credentials");
  }
);

// Creates a new license for a client.
export const createLicense = api<CreateLicenseRequest, CreateLicenseResponse>(
  { auth: false, expose: true, method: "POST", path: "/auth/admin/licenses" },
  async (req) => {
    // Check if phone ID already exists
    const existingLicense = await authDB.queryRow<{ id: number }>`
      SELECT id FROM licenses WHERE phone_id = ${req.phoneId}
    `;

    if (existingLicense) {
      throw APIError.alreadyExists("A license already exists for this phone ID");
    }

    if (!req.password) {
      throw APIError.invalidArgument("Password is required");
    }

    // Generate license key
    const licenseKey = generateLicenseKey();
    
    // FIXME: Password should be hashed in a real application.
    // Storing as plaintext for demonstration due to environment constraints.
    const passwordHash = req.password;

    // Parse expiration date if provided
    let expiresAt: Date | null = null;
    if (req.expiresAt) {
      expiresAt = new Date(req.expiresAt);
      if (isNaN(expiresAt.getTime())) {
        throw APIError.invalidArgument("Invalid expiration date format");
      }
    }

    const license = await authDB.queryRow<{
      id: number;
      license_key: string;
      phone_id: string;
      client_name: string;
      email: string | null;
      company_name: string | null;
      is_active: boolean;
      expires_at: Date | null;
      created_at: Date;
    }>`
      INSERT INTO licenses (license_key, phone_id, client_name, email, company_name, expires_at, password_hash)
      VALUES (${licenseKey}, ${req.phoneId}, ${req.clientName}, ${req.email}, ${req.companyName}, ${expiresAt}, ${passwordHash})
      RETURNING id, license_key, phone_id, client_name, email, company_name, is_active, expires_at, created_at
    `;

    if (!license) {
      throw new Error("Failed to create license");
    }

    return {
      license: {
        id: license.id,
        licenseKey: license.license_key,
        phoneId: license.phone_id,
        clientName: license.client_name,
        email: license.email || undefined,
        companyName: license.company_name || undefined,
        isActive: license.is_active,
        expiresAt: license.expires_at?.toISOString(),
        createdAt: license.created_at.toISOString()
      },
      success: true
    };
  }
);

// Gets all licenses.
export const listLicenses = api<void, ListLicensesResponse>(
  { auth: false, expose: true, method: "GET", path: "/auth/admin/licenses" },
  async () => {
    const licenses = await authDB.queryAll<{
      id: number;
      license_key: string;
      phone_id: string;
      client_name: string;
      email: string | null;
      company_name: string | null;
      is_active: boolean;
      expires_at: Date | null;
      created_at: Date;
    }>`
      SELECT id, license_key, phone_id, client_name, email, company_name, is_active, expires_at, created_at
      FROM licenses
      ORDER BY created_at DESC
    `;

    return {
      licenses: licenses.map(license => ({
        id: license.id,
        licenseKey: license.license_key,
        phoneId: license.phone_id,
        clientName: license.client_name,
        email: license.email || undefined,
        companyName: license.company_name || undefined,
        isActive: license.is_active,
        expiresAt: license.expires_at?.toISOString(),
        createdAt: license.created_at.toISOString()
      })),
      total: licenses.length
    };
  }
);

// Gets all trial sessions.
export const listTrialSessions = api<void, ListTrialSessionsResponse>(
  { auth: false, expose: true, method: "GET", path: "/auth/admin/trials" },
  async () => {
    const sessions = await authDB.queryAll<{
      id: number;
      device_id: string;
      started_at: Date;
      expires_at: Date;
      is_active: boolean;
    }>`
      SELECT id, device_id, started_at, expires_at, is_active
      FROM trial_sessions
      ORDER BY started_at DESC
    `;

    const now = new Date();
    
    return {
      sessions: sessions.map(session => {
        const timeRemaining = session.is_active && now < session.expires_at 
          ? Math.ceil((session.expires_at.getTime() - now.getTime()) / (1000 * 60))
          : 0;
        
        return {
          id: session.id,
          deviceId: session.device_id,
          startedAt: session.started_at.toISOString(),
          expiresAt: session.expires_at.toISOString(),
          isActive: session.is_active && now < session.expires_at,
          timeRemaining: timeRemaining > 0 ? timeRemaining : undefined
        };
      }),
      total: sessions.length
    };
  }
);

// Deactivates a license.
export const deactivateLicense = api<{ id: number }, { success: boolean }>(
  { auth: false, expose: true, method: "POST", path: "/auth/admin/licenses/:id/deactivate" },
  async (req) => {
    await authDB.exec`
      UPDATE licenses 
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = ${req.id}
    `;

    return { success: true };
  }
);

// Activates a license.
export const activateLicense = api<{ id: number }, { success: boolean }>(
  { auth: false, expose: true, method: "POST", path: "/auth/admin/licenses/:id/activate" },
  async (req) => {
    await authDB.exec`
      UPDATE licenses 
      SET is_active = TRUE, updated_at = NOW()
      WHERE id = ${req.id}
    `;

    return { success: true };
  }
);

// Terminates a trial session.
export const terminateTrialSession = api<{ id: number }, { success: boolean }>(
  { auth: false, expose: true, method: "POST", path: "/auth/admin/trials/:id/terminate" },
  async (req) => {
    await authDB.exec`
      UPDATE trial_sessions 
      SET is_active = FALSE
      WHERE id = ${req.id}
    `;

    return { success: true };
  }
);

// Helper function to generate license key
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
}
