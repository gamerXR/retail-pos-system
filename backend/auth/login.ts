import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { posDB } from "../pos/db";

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
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
      message: "Login successful"
    };
  }
);


