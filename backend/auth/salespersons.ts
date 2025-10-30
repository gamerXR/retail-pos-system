import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { getAuthData } from "~encore/auth";

export interface Salesperson {
  id: number;
  clientId: number;
  name: string;
  phoneNumber: string;
  canProcessReturns: boolean;
  canGiveDiscounts: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalespersonRequest {
  name: string;
  phoneNumber: string;
  password: string;
  canProcessReturns: boolean;
  canGiveDiscounts: boolean;
}

export interface CreateSalespersonResponse {
  salesperson: Salesperson;
  success: boolean;
}

export const createSalesperson = api<CreateSalespersonRequest, CreateSalespersonResponse>(
  { auth: true, expose: true, method: "POST", path: "/auth/salespersons" },
  async (req) => {
    const auth = getAuthData()!;

    if (!req.name || !req.phoneNumber || !req.password) {
      throw APIError.invalidArgument("Name, phone number, and password are required");
    }

    const existing = await authDB.queryRow<{ id: number }>`
      SELECT id FROM salespersons 
      WHERE client_id = ${auth.clientID} AND phone_number = ${req.phoneNumber}
    `;

    if (existing) {
      throw APIError.alreadyExists("A salesperson with this phone number already exists");
    }

    const salesperson = await authDB.queryRow<{
      id: number;
      client_id: number;
      name: string;
      phone_number: string;
      can_process_returns: boolean;
      can_give_discounts: boolean;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO salespersons (
        client_id, name, phone_number, password_hash, 
        can_process_returns, can_give_discounts
      )
      VALUES (
        ${auth.clientID}, ${req.name}, ${req.phoneNumber}, ${req.password},
        ${req.canProcessReturns}, ${req.canGiveDiscounts}
      )
      RETURNING id, client_id, name, phone_number, can_process_returns, 
                can_give_discounts, is_active, created_at, updated_at
    `;

    if (!salesperson) {
      throw new Error("Failed to create salesperson");
    }

    return {
      salesperson: {
        id: salesperson.id,
        clientId: salesperson.client_id,
        name: salesperson.name,
        phoneNumber: salesperson.phone_number,
        canProcessReturns: salesperson.can_process_returns,
        canGiveDiscounts: salesperson.can_give_discounts,
        isActive: salesperson.is_active,
        createdAt: salesperson.created_at.toISOString(),
        updatedAt: salesperson.updated_at.toISOString()
      },
      success: true
    };
  }
);

export interface ListSalespersonsResponse {
  salespersons: Salesperson[];
}

export const listSalespersons = api<void, ListSalespersonsResponse>(
  { auth: true, expose: true, method: "GET", path: "/auth/salespersons" },
  async () => {
    const auth = getAuthData()!;

    const salespersons = await authDB.queryAll<{
      id: number;
      client_id: number;
      name: string;
      phone_number: string;
      can_process_returns: boolean;
      can_give_discounts: boolean;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, client_id, name, phone_number, can_process_returns,
             can_give_discounts, is_active, created_at, updated_at
      FROM salespersons
      WHERE client_id = ${auth.clientID}
      ORDER BY created_at DESC
    `;

    return {
      salespersons: salespersons.map(sp => ({
        id: sp.id,
        clientId: sp.client_id,
        name: sp.name,
        phoneNumber: sp.phone_number,
        canProcessReturns: sp.can_process_returns,
        canGiveDiscounts: sp.can_give_discounts,
        isActive: sp.is_active,
        createdAt: sp.created_at.toISOString(),
        updatedAt: sp.updated_at.toISOString()
      }))
    };
  }
);

export interface UpdateSalespersonRequest {
  id: number;
  name?: string;
  phoneNumber?: string;
  canProcessReturns?: boolean;
  canGiveDiscounts?: boolean;
  isActive?: boolean;
}

export const updateSalesperson = api<UpdateSalespersonRequest, { success: boolean; salesperson: Salesperson }>(
  { auth: true, expose: true, method: "PUT", path: "/auth/salespersons/:id" },
  async (req) => {
    const auth = getAuthData()!;

    const salesperson = await authDB.queryRow<{
      id: number;
      client_id: number;
      name: string;
      phone_number: string;
      can_process_returns: boolean;
      can_give_discounts: boolean;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>`
      UPDATE salespersons
      SET
        name = COALESCE(${req.name}, name),
        phone_number = COALESCE(${req.phoneNumber}, phone_number),
        can_process_returns = COALESCE(${req.canProcessReturns}, can_process_returns),
        can_give_discounts = COALESCE(${req.canGiveDiscounts}, can_give_discounts),
        is_active = COALESCE(${req.isActive}, is_active),
        updated_at = NOW()
      WHERE id = ${req.id} AND client_id = ${auth.clientID}
      RETURNING id, client_id, name, phone_number, can_process_returns,
                can_give_discounts, is_active, created_at, updated_at
    `;

    if (!salesperson) {
      throw APIError.notFound("Salesperson not found");
    }

    return {
      success: true,
      salesperson: {
        id: salesperson.id,
        clientId: salesperson.client_id,
        name: salesperson.name,
        phoneNumber: salesperson.phone_number,
        canProcessReturns: salesperson.can_process_returns,
        canGiveDiscounts: salesperson.can_give_discounts,
        isActive: salesperson.is_active,
        createdAt: salesperson.created_at.toISOString(),
        updatedAt: salesperson.updated_at.toISOString()
      }
    };
  }
);

export interface DeleteSalespersonRequest {
  id: number;
}

export const deleteSalesperson = api<DeleteSalespersonRequest, { success: boolean }>(
  { auth: true, expose: true, method: "DELETE", path: "/auth/salespersons/:id" },
  async (req) => {
    const auth = getAuthData()!;

    await authDB.exec`
      DELETE FROM salespersons 
      WHERE id = ${req.id} AND client_id = ${auth.clientID}
    `;

    return { success: true };
  }
);

export interface UpdateSalespersonPasswordRequest {
  id: number;
  password: string;
}

export const updateSalespersonPassword = api<UpdateSalespersonPasswordRequest, { success: boolean }>(
  { auth: true, expose: true, method: "POST", path: "/auth/salespersons/:id/password" },
  async (req) => {
    const auth = getAuthData()!;

    if (!req.password) {
      throw APIError.invalidArgument("Password is required");
    }

    await authDB.exec`
      UPDATE salespersons
      SET password_hash = ${req.password}, updated_at = NOW()
      WHERE id = ${req.id} AND client_id = ${auth.clientID}
    `;

    return { success: true };
  }
);

export interface SalespersonLoginRequest {
  phoneNumber: string;
  password: string;
}

export interface SalespersonLoginResponse {
  salespersonId: number;
  clientId: number;
  name: string;
  phoneNumber: string;
  canProcessReturns: boolean;
  canGiveDiscounts: boolean;
  token: string;
}

export const salespersonLogin = api<SalespersonLoginRequest, SalespersonLoginResponse>(
  { expose: true, method: "POST", path: "/auth/salesperson/login" },
  async (req) => {
    if (!req.phoneNumber || !req.password) {
      throw APIError.invalidArgument("Phone number and password are required");
    }

    const salesperson = await authDB.queryRow<{
      id: number;
      client_id: number;
      name: string;
      phone_number: string;
      password_hash: string;
      can_process_returns: boolean;
      can_give_discounts: boolean;
      is_active: boolean;
    }>`
      SELECT id, client_id, name, phone_number, password_hash,
             can_process_returns, can_give_discounts, is_active
      FROM salespersons
      WHERE phone_number = ${req.phoneNumber}
    `;

    if (!salesperson) {
      throw APIError.unauthenticated("Invalid phone number or password");
    }

    if (!salesperson.is_active) {
      throw APIError.permissionDenied("This salesperson account is inactive");
    }

    if (salesperson.password_hash !== req.password) {
      throw APIError.unauthenticated("Invalid phone number or password");
    }

    return {
      salespersonId: salesperson.id,
      clientId: salesperson.client_id,
      name: salesperson.name,
      phoneNumber: salesperson.phone_number,
      canProcessReturns: salesperson.can_process_returns,
      canGiveDiscounts: salesperson.can_give_discounts,
      token: `sp_${salesperson.id}_${salesperson.client_id}`
    };
  }
);
