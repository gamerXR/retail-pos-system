import { api } from "encore.dev/api";
import { posDB } from "./db";
import * as email from "../email/send";

export interface SendLogsResponse {
  success: boolean;
  message: string;
  sentAt: Date;
}

export const sendLogs = api(
  { method: "POST", path: "/pos/send-logs", expose: true, auth: true },
  async (): Promise<SendLogsResponse> => {
    const today = new Date();
    const startDate = new Date(today.setHours(0, 0, 0, 0));
    const endDate = new Date(today.setHours(23, 59, 59, 999));

    const salesResult = await posDB.queryAll<any>`
      SELECT 
        s.id, 
        s.total_amount, 
        s.payment_method, 
        s.created_at,
        s.sales_person,
        s.remarks,
        COUNT(si.id) as items_count
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.created_at >= ${startDate} AND s.created_at <= ${endDate}
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `;

    const expensesResult = await posDB.queryAll<any>`
      SELECT id, description, amount, category, created_at
      FROM expenses
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      ORDER BY created_at DESC
    `;

    const totalSales = salesResult.reduce((sum: number, sale: any) => sum + parseFloat(sale.total_amount), 0);
    const totalExpenses = expensesResult.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0);

    const emailBody = `
      <h2>POS Transaction Logs - ${new Date().toLocaleDateString()}</h2>
      
      <h3>Summary</h3>
      <ul>
        <li><strong>Total Sales:</strong> $${totalSales.toFixed(2)}</li>
        <li><strong>Total Transactions:</strong> ${salesResult.length}</li>
        <li><strong>Total Expenses:</strong> $${totalExpenses.toFixed(2)}</li>
        <li><strong>Net Cashflow:</strong> $${(totalSales - totalExpenses).toFixed(2)}</li>
      </ul>

      <h3>Sales Transactions (${salesResult.length})</h3>
      <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th>ID</th>
            <th>Time</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Items</th>
            <th>Salesperson</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${salesResult.map((sale: any) => `
            <tr>
              <td>${sale.id}</td>
              <td>${new Date(sale.created_at).toLocaleString()}</td>
              <td>$${parseFloat(sale.total_amount).toFixed(2)}</td>
              <td>${sale.payment_method || 'Cash'}</td>
              <td>${sale.items_count}</td>
              <td>${sale.sales_person || '-'}</td>
              <td>${sale.remarks || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3>Expenses (${expensesResult.length})</h3>
      <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th>ID</th>
            <th>Time</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${expensesResult.map((expense: any) => `
            <tr>
              <td>${expense.id}</td>
              <td>${new Date(expense.created_at).toLocaleString()}</td>
              <td>${expense.description}</td>
              <td>${expense.category || '-'}</td>
              <td>$${parseFloat(expense.amount).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <p style="margin-top: 20px; color: #666;">
        <em>This is an automated log report from your POS System.</em>
      </p>
    `;

    try {
      await email.send({
        to: "posx.dayat@gmail.com",
        subject: `POS Transaction Logs - ${new Date().toLocaleDateString()}`,
        htmlContent: emailBody
      });

      return {
        success: true,
        message: "Transaction logs sent successfully to posx.dayat@gmail.com",
        sentAt: new Date()
      };
    } catch (error) {
      console.error("Error sending logs:", error);
      throw new Error("Failed to send transaction logs");
    }
  }
);
