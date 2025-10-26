import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import type { AuthData } from "../auth/auth";
import { authDB } from "../auth/db";

export interface EmployeeListResponse {
  employees: { phoneNumber: string; name: string }[];
}

export const getEmployees = api<void, EmployeeListResponse>(
  { auth: true, expose: true, method: "GET", path: "/auth/employees" },
  async () => {
    const auth = getAuthData()! as AuthData;
    
    const employees = await authDB.query<{
      phone_number: string;
      client_name: string;
    }>`
      SELECT phone_number, client_name
      FROM clients
      WHERE status = 'active'
      ORDER BY client_name ASC
    `;

    const results: { phoneNumber: string; name: string }[] = [];
    for await (const emp of employees) {
      results.push({
        phoneNumber: emp.phone_number,
        name: emp.client_name
      });
    }

    return {
      employees: results
    };
  }
);
