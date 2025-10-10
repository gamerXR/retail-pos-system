import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";

export interface CreateClientRequest {
  clientName: string;
  password: string;
  email?: string;
  companyName?: string;
  phone?: string;
}

export interface Client {
  id: number;
  clientId: string;
  clientName: string;
  email?: string;
  companyName?: string;
  phone?: string;
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
  { expose: true, method: "POST", path: "/auth/admin/clients" },
  async (req) => {
    if (!req.password) {
      throw APIError.invalidArgument("Password is required");
    }

    const clientId = generateClientId();
    const passwordHash = req.password;

    const client = await authDB.queryRow<{
      id: number;
      client_id: string;
      client_name: string;
      email: string | null;
      company_name: string | null;
      phone: string | null;
      status: string;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO clients (client_id, client_name, password_hash, email, company_name, phone)
      VALUES (${clientId}, ${req.clientName}, ${passwordHash}, ${req.email}, ${req.companyName}, ${req.phone})
      RETURNING id, client_id, client_name, email, company_name, phone, status, created_at, updated_at
    `;

    if (!client) {
      throw new Error("Failed to create client");
    }

    return {
      client: {
        id: client.id,
        clientId: client.client_id,
        clientName: client.client_name,
        email: client.email || undefined,
        companyName: client.company_name || undefined,
        phone: client.phone || undefined,
        status: client.status,
        createdAt: client.created_at.toISOString(),
        updatedAt: client.updated_at.toISOString()
      },
      success: true
    };
  }
);

export const listClients = api<void, ListClientsResponse>(
  { expose: true, method: "GET", path: "/auth/admin/clients" },
  async () => {
    const clients = await authDB.queryAll<{
      id: number;
      client_id: string;
      client_name: string;
      email: string | null;
      company_name: string | null;
      phone: string | null;
      status: string;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, client_id, client_name, email, company_name, phone, status, created_at, updated_at
      FROM clients
      ORDER BY created_at DESC
    `;

    return {
      clients: clients.map(client => ({
        id: client.id,
        clientId: client.client_id,
        clientName: client.client_name,
        email: client.email || undefined,
        companyName: client.company_name || undefined,
        phone: client.phone || undefined,
        status: client.status,
        createdAt: client.created_at.toISOString(),
        updatedAt: client.updated_at.toISOString()
      })),
      total: clients.length
    };
  }
);

export const updateClientStatus = api<UpdateClientStatusRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/auth/admin/clients/:id/status" },
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
  { expose: true, method: "GET", path: "/auth/admin/clients/stats" },
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

function generateClientId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `CLI-${timestamp}-${randomPart}`.toUpperCase();
}
