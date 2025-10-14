import { Header, Cookie, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { authDB } from "./db";

interface AuthParams {
  authorization?: Header<"Authorization">;
  session?: Cookie<"session">;
}

export interface AuthData {
  userID: string;
  clientID: number;
  phoneNumber: string;
  clientName: string;
}

export const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "") ?? data.session?.value;
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    const client = await authDB.queryRow<{
      id: number;
      phone_number: string;
      client_name: string;
      status: string;
    }>`
      SELECT id, phone_number, client_name, status
      FROM clients 
      WHERE phone_number = ${token}
    `;

    if (!client) {
      throw APIError.unauthenticated("invalid token");
    }

    if (client.status !== 'active') {
      throw APIError.unauthenticated(`account is ${client.status}`);
    }

    return {
      userID: client.phone_number,
      clientID: client.id,
      phoneNumber: client.phone_number,
      clientName: client.client_name
    };
  }
);

export const gw = new Gateway({ authHandler: auth });
