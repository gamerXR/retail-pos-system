import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";

export interface ClientLoginRequest {
  phoneNumber: string;
  password: string;
}

export interface ClientLoginResponse {
  token: string;
  client: {
    id: number;
    phoneNumber: string;
    clientName: string;
    email?: string;
    companyName?: string;
  };
}

export const clientLogin = api<ClientLoginRequest, ClientLoginResponse>(
  { auth: false, expose: true, method: "POST", path: "/auth/client/login" },
  async (req) => {
    if (!req.phoneNumber || !req.password) {
      throw APIError.unauthenticated("Phone number and password are required");
    }

    const client = await authDB.queryRow<{
      id: number;
      phone_number: string;
      client_name: string;
      password_hash: string;
      email: string | null;
      company_name: string | null;
      status: string;
    }>`
      SELECT id, phone_number, client_name, password_hash, email, company_name, status
      FROM clients
      WHERE phone_number = ${req.phoneNumber}
    `;

    if (!client) {
      throw APIError.unauthenticated("Invalid phone number or password");
    }

    if (client.status !== 'active') {
      throw APIError.permissionDenied(`Account is ${client.status}. Please contact support.`);
    }

    if (client.password_hash !== req.password) {
      throw APIError.unauthenticated("Invalid phone number or password");
    }

    const token = `client_${client.id}_${Date.now()}`;

    return {
      token,
      client: {
        id: client.id,
        phoneNumber: client.phone_number,
        clientName: client.client_name,
        email: client.email || undefined,
        companyName: client.company_name || undefined
      }
    };
  }
);
