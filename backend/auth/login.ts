import { api, APIError, Cookie } from "encore.dev/api";
import { authDB } from "./db";

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  session: Cookie<"session">;
  clientName: string;
  clientID: number;
}

export const login = api<LoginRequest, LoginResponse>(
  { auth: false, expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    const client = await authDB.queryRow<{
      id: number;
      phone_number: string;
      client_name: string;
      password_hash: string;
      status: string;
    }>`
      SELECT id, phone_number, client_name, password_hash, status
      FROM clients 
      WHERE phone_number = ${req.phoneNumber}
    `;

    if (!client) {
      throw APIError.unauthenticated("Invalid phone number or password");
    }

    const passwordMatch = req.password === client.password_hash;
    if (!passwordMatch) {
      throw APIError.unauthenticated("Invalid phone number or password");
    }

    if (client.status !== 'active') {
      throw APIError.unauthenticated(`Account is ${client.status}. Please contact administrator.`);
    }

    return {
      success: true,
      message: "Login successful",
      session: {
        value: req.phoneNumber,
        expires: new Date(Date.now() + 3600 * 1000 * 24 * 30),
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      },
      clientName: client.client_name,
      clientID: client.id
    };
  }
);


