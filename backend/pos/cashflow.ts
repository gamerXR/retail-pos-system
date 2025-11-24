import { api } from "encore.dev/api";
import { posDB } from "./db";

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  category?: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string | null;
  createdAt: Date;
  employeeId: number;
}

export interface CashflowReportRequest {
  startDate?: Date;
  endDate?: Date;
}

export interface CashflowReport {
  totalSales: number;
  totalExpenses: number;
  netCashflow: number;
  expenses: Expense[];
  startDate: Date;
  endDate: Date;
}

export const createExpense = api(
  { method: "POST", path: "/pos/expenses", expose: true, auth: true },
  async (req: CreateExpenseRequest): Promise<Expense> => {
    const description = req.description;
    const amount = req.amount;
    const category = req.category || null;
    const employeeId = 1;

    const result = await posDB.queryRow<Expense>`
      INSERT INTO expenses (description, amount, category, employee_id, created_at)
      VALUES (${description}, ${amount}, ${category}, ${employeeId}, NOW())
      RETURNING id, description, amount, category, created_at as "createdAt", employee_id as "employeeId"
    `;

    return result!;
  }
);

export const listExpenses = api(
  { method: "GET", path: "/pos/expenses", expose: true, auth: true },
  async (): Promise<{ expenses: Expense[] }> => {
    const result = await posDB.queryAll<Expense>`
      SELECT id, description, amount, category, created_at as "createdAt", employee_id as "employeeId"
      FROM expenses
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return { expenses: result };
  }
);

export const getCashflowReport = api(
  { method: "POST", path: "/pos/cashflow-report", expose: true, auth: true },
  async (req: CashflowReportRequest): Promise<CashflowReport> => {
    const startDate = req.startDate || new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = req.endDate || new Date(new Date().setHours(23, 59, 59, 999));

    const salesResult = await posDB.queryRow<{ totalSales: number }>`
      SELECT COALESCE(SUM(total_amount), 0) as "totalSales"
      FROM sales
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    `;

    const expensesResult = await posDB.queryAll<Expense>`
      SELECT id, description, amount, category, created_at as "createdAt", employee_id as "employeeId"
      FROM expenses
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      ORDER BY created_at DESC
    `;

    const totalSales = salesResult?.totalSales || 0;
    const totalExpenses = expensesResult.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);

    return {
      totalSales,
      totalExpenses,
      netCashflow: totalSales - totalExpenses,
      expenses: expensesResult,
      startDate,
      endDate
    };
  }
);

export const deleteExpense = api(
  { method: "DELETE", path: "/pos/expenses/:id", expose: true, auth: true },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    const expenseId = parseInt(id);
    
    await posDB.exec`
      DELETE FROM expenses WHERE id = ${expenseId}
    `;

    return { success: true };
  }
);
