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

    if (token.startsWith("sp_")) {
      const parts = token.split("_");
      if (parts.length !== 3) {
        throw APIError.unauthenticated("invalid salesperson token format");
      }

      const salespersonId = parseInt(parts[1]);
      const clientId = parseInt(parts[2]);

      if (isNaN(salespersonId) || isNaN(clientId)) {
        throw APIError.unauthenticated("invalid salesperson token");
      }

      const salesperson = await authDB.queryRow<{
        id: number;
        client_id: number;
        name: string;
        phone_number: string;
        is_active: boolean;
      }>`
        SELECT id, client_id, name, phone_number, is_active
        FROM salespersons
        WHERE id = ${salespersonId} AND client_id = ${clientId}
      `;

      if (!salesperson) {
        throw APIError.unauthenticated("invalid token");
      }

      if (!salesperson.is_active) {
        throw APIError.unauthenticated("salesperson account is inactive");
      }

      return {
        userID: `sp_${salesperson.id}`,
        clientID: salesperson.client_id,
        phoneNumber: salesperson.phone_number,
        clientName: salesperson.name
      };
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
