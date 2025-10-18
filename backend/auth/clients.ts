import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";

export interface CreateClientRequest {
  phoneNumber: string;
  clientName: string;
  password: string;
  email?: string;
  companyName?: string;
}

export interface Client {
  id: number;
  phoneNumber: string;
  clientName: string;
  email?: string;
  companyName?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientResponse {
  client: Client;
  success: boolean;
}

export interface ListClientsResponse {
  clients: Client[];
  total: number;
}

export interface UpdateClientStatusRequest {
  id: number;
  status: string;
}

export interface ClientStatsResponse {
  totalClients: number;
  activeClients: number;
  onHoldClients: number;
  suspendedClients: number;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
}

export const createClient = api<CreateClientRequest, CreateClientResponse>(
  { auth: false, expose: true, method: "POST", path: "/auth/admin/clients" },
  async (req) => {
    if (!req.password) {
      throw APIError.invalidArgument("Password is required");
    }

    if (!req.phoneNumber) {
      throw APIError.invalidArgument("Phone number is required");
    }

    const passwordHash = req.password;

    const client = await authDB.queryRow<{
      id: number;
      phone_number: string;
      client_name: string;
      email: string | null;
      company_name: string | null;
      status: string;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO clients (phone_number, client_name, password_hash, email, company_name)
      VALUES (${req.phoneNumber}, ${req.clientName}, ${passwordHash}, ${req.email}, ${req.companyName})
      RETURNING id, phone_number, client_name, email, company_name, status, created_at, updated_at
    `;

    if (!client) {
      throw new Error("Failed to create client");
    }

    return {
      client: {
        id: client.id,
        phoneNumber: client.phone_number,
        clientName: client.client_name,
        email: client.email || undefined,
        companyName: client.company_name || undefined,
        status: client.status,
        createdAt: client.created_at.toISOString(),
        updatedAt: client.updated_at.toISOString()
      },
      success: true
    };
  }
);

export const listClients = api<void, ListClientsResponse>(
  { auth: false, expose: true, method: "GET", path: "/auth/admin/clients" },
  async () => {
    const clients = await authDB.queryAll<{
      id: number;
      phone_number: string;
      client_name: string;
      email: string | null;
      company_name: string | null;
      status: string;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, phone_number, client_name, email, company_name, status, created_at, updated_at
      FROM clients
      ORDER BY created_at DESC
    `;

    return {
      clients: clients.map(client => ({
        id: client.id,
        phoneNumber: client.phone_number,
        clientName: client.client_name,
        email: client.email || undefined,
        companyName: client.company_name || undefined,
        status: client.status,
        createdAt: client.created_at.toISOString(),
        updatedAt: client.updated_at.toISOString()
      })),
      total: clients.length
    };
  }
);

export const updateClientStatus = api<UpdateClientStatusRequest, { success: boolean }>(
  { auth: false, expose: true, method: "POST", path: "/auth/admin/clients/:id/status" },
  async (req) => {
    const validStatuses = ['active', 'onhold', 'suspended', 'inactive'];
    if (!validStatuses.includes(req.status)) {
      throw APIError.invalidArgument(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    await authDB.exec`
      UPDATE clients 
      SET status = ${req.status}, updated_at = NOW()
      WHERE id = ${req.id}
    `;

    return { success: true };
  }
);

export const getClientStats = api<void, ClientStatsResponse>(
  { auth: false, expose: true, method: "GET", path: "/auth/admin/clients/stats" },
  async () => {
    const totalResult = await authDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM clients
    `;

    const activeResult = await authDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM clients WHERE status = 'active'
    `;

    const onHoldResult = await authDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM clients WHERE status = 'onhold'
    `;

    const suspendedResult = await authDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM clients WHERE status = 'suspended'
    `;

    const breakdown = await authDB.queryAll<{
      status: string;
      count: number;
    }>`
      SELECT status, COUNT(*) as count
      FROM clients
      GROUP BY status
      ORDER BY count DESC
    `;

    return {
      totalClients: totalResult?.count || 0,
      activeClients: activeResult?.count || 0,
      onHoldClients: onHoldResult?.count || 0,
      suspendedClients: suspendedResult?.count || 0,
      statusBreakdown: breakdown.map(item => ({
        status: item.status,
        count: Number(item.count)
      }))
    };
  }
);

export interface UpdateClientRequest {
  id: number;
  clientName?: string;
  phoneNumber?: string;
  email?: string;
  companyName?: string;
}

export const updateClient = api<UpdateClientRequest, { success: boolean; client: Client }>(
  { auth: false, expose: true, method: "PUT", path: "/auth/admin/clients/:id" },
  async (req) => {
    const client = await authDB.queryRow<{
      id: number;
      phone_number: string;
      client_name: string;
      email: string | null;
      company_name: string | null;
      status: string;
      created_at: Date;
      updated_at: Date;
    }>`
      UPDATE clients 
      SET 
        client_name = COALESCE(${req.clientName}, client_name),
        phone_number = COALESCE(${req.phoneNumber}, phone_number),
        email = COALESCE(${req.email}, email),
        company_name = COALESCE(${req.companyName}, company_name),
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, phone_number, client_name, email, company_name, status, created_at, updated_at
    `;

    if (!client) {
      throw APIError.notFound("Client not found");
    }

    return {
      success: true,
      client: {
        id: client.id,
        phoneNumber: client.phone_number,
        clientName: client.client_name,
        email: client.email || undefined,
        companyName: client.company_name || undefined,
        status: client.status,
        createdAt: client.created_at.toISOString(),
        updatedAt: client.updated_at.toISOString()
      }
    };
  }
);

export interface DeleteClientRequest {
  id: number;
}

export const deleteClient = api<DeleteClientRequest, { success: boolean }>(
  { auth: false, expose: true, method: "DELETE", path: "/auth/admin/clients/:id" },
  async (req) => {
    await authDB.exec`
      DELETE FROM clients WHERE id = ${req.id}
    `;

    return { success: true };
  }
);

export interface ResetPasswordRequest {
  id: number;
}

export const resetClientPassword = api<ResetPasswordRequest, { success: boolean }>(
  { auth: false, expose: true, method: "POST", path: "/auth/admin/clients/:id/reset-password" },
  async (req) => {
    const defaultPassword = "123456";
    
    await authDB.exec`
      UPDATE clients 
      SET password_hash = ${defaultPassword}, updated_at = NOW()
      WHERE id = ${req.id}
    `;

    return { success: true };
  }
);

