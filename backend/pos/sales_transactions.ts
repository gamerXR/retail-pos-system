import { api } from "encore.dev/api";
import { posDB } from "./db";

export interface SalesTransactionsRequest {
  startDate: Date;
  endDate: Date;
}

export interface TransactionItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SalesTransaction {
  receipt_number: string;
  sale_date: Date;
  sale_time: string;
  payment_method: string;
  total_amount: number;
  items: TransactionItem[];
}

export interface SalesTransactionsResponse {
  transactions: SalesTransaction[];
}

export const getSalesTransactions = api(
  { expose: true, method: "POST", path: "/pos/sales-transactions" },
  async ({ startDate, endDate }: SalesTransactionsRequest): Promise<SalesTransactionsResponse> => {
    const sales = await posDB.queryAll<{
      id: number;
      receipt_number: string;
      created_at: Date;
      payment_method: string;
      total_amount: number;
    }>`
      SELECT 
        id,
        receipt_number,
        created_at,
        payment_method,
        total_amount
      FROM sales
      WHERE created_at >= ${startDate}
        AND created_at <= ${endDate}
      ORDER BY created_at DESC
    `;

    const transactions: SalesTransaction[] = [];

    for (const sale of sales) {
      const items = await posDB.queryAll<{
        product_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>`
        SELECT 
          p.name as product_name,
          si.quantity,
          si.unit_price,
          si.total_price
        FROM sale_items si
        JOIN products p ON p.id = si.product_id
        WHERE si.sale_id = ${sale.id}
        ORDER BY si.id
      `;

      const date = new Date(sale.created_at);
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      transactions.push({
        receipt_number: sale.receipt_number,
        sale_date: date,
        sale_time: timeStr,
        payment_method: sale.payment_method || 'Cash',
        total_amount: Number(sale.total_amount),
        items: items.map(item => ({
          product_name: item.product_name,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price)
        }))
      });
    }

    return { transactions };
  }
);
