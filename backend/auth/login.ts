import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { posDB } from "../pos/db";

export interface LoginRequest {
  clientId: string;
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
      client_id: string;
      client_name: string;
      password_hash: string;
      status: string;
    }>`
      SELECT id, client_id, client_name, password_hash, status
      FROM clients 
      WHERE client_id = ${req.clientId}
    `;

    if (!client) {
      throw APIError.unauthenticated("Invalid client ID or password");
    }

    const passwordMatch = req.password === client.password_hash;
    if (!passwordMatch) {
      throw APIError.unauthenticated("Invalid client ID or password");
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


