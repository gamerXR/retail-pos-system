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
    const user = await authDB.queryRow<{
      id: number;
      phone_number: string;
      password_hash: string;
    }>`
      SELECT id, phone_number, password_hash
      FROM users 
      WHERE phone_number = ${req.phoneNumber}
    `;

    if (!user) {
      throw APIError.unauthenticated("Invalid phone number or password");
    }

    const passwordMatch = req.password === user.password_hash;
    if (!passwordMatch) {
      throw APIError.unauthenticated("Invalid phone number or password");
    }

    return {
      success: true,
      message: "Login successful"
    };
  }
);


