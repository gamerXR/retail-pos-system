import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import type { AuthData } from "../auth/auth";
import { posDB } from "./db";

export interface ReceiptSearchRequest {
  date?: string;
  orderNumber?: string;
}

export interface ReceiptItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Receipt {
  id: number;
  orderNumber: string;
  date: string;
  time: string;
  total: number;
  paymentMethod: string;
  itemCount: number;
  items: ReceiptItem[];
}

export interface ReceiptSearchResponse {
  receipts: Receipt[];
  success: boolean;
}

export const searchReceipts = api<ReceiptSearchRequest, ReceiptSearchResponse>(
  { auth: true, expose: true, method: "GET", path: "/pos/receipts/search" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    try {
      let receipts: Receipt[] = [];

      if (req.orderNumber) {
        const sale = await posDB.queryRow<{
          id: number;
          total_amount: number;
          payment_method: string;
          created_at: Date;
        }>`
          SELECT id, total_amount, payment_method, created_at
          FROM sales
          WHERE id::text = ${req.orderNumber} AND client_id = ${auth.clientID}
        `;

        if (sale) {
          const items = await posDB.queryAll<{
            product_id: number;
            product_name: string;
            quantity: number;
            unit_price: number;
            total_price: number;
          }>`
            SELECT 
              si.product_id,
              p.name as product_name,
              si.quantity,
              si.unit_price,
              si.total_price
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ${sale.id}
          `;

          const receipt: Receipt = {
            id: sale.id,
            orderNumber: `ORD-${sale.id.toString().padStart(3, '0')}`,
            date: sale.created_at.toISOString().split('T')[0],
            time: sale.created_at.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            total: sale.total_amount,
            paymentMethod: sale.payment_method,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
            items: items.map(item => ({
              productId: item.product_id,
              productName: item.product_name,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              totalPrice: item.total_price
            }))
          };

          receipts.push(receipt);
        }
      } else if (req.date) {
        const sales = await posDB.queryAll<{
          id: number;
          total_amount: number;
          payment_method: string;
          created_at: Date;
        }>`
          SELECT id, total_amount, payment_method, created_at
          FROM sales
          WHERE DATE(created_at) = ${req.date} AND client_id = ${auth.clientID}
          ORDER BY created_at DESC
        `;

        for (const sale of sales) {
          const items = await posDB.queryAll<{
            product_id: number;
            product_name: string;
            quantity: number;
            unit_price: number;
            total_price: number;
          }>`
            SELECT 
              si.product_id,
              p.name as product_name,
              si.quantity,
              si.unit_price,
              si.total_price
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ${sale.id}
          `;

          const receipt: Receipt = {
            id: sale.id,
            orderNumber: `ORD-${sale.id.toString().padStart(3, '0')}`,
            date: sale.created_at.toISOString().split('T')[0],
            time: sale.created_at.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            total: sale.total_amount,
            paymentMethod: sale.payment_method,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
            items: items.map(item => ({
              productId: item.product_id,
              productName: item.product_name,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              totalPrice: item.total_price
            }))
          };

          receipts.push(receipt);
        }
      } else {
        const today = new Date().toISOString().split('T')[0];
        const sales = await posDB.queryAll<{
          id: number;
          total_amount: number;
          payment_method: string;
          created_at: Date;
        }>`
          SELECT id, total_amount, payment_method, created_at
          FROM sales
          WHERE DATE(created_at) = ${today} AND client_id = ${auth.clientID}
          ORDER BY created_at DESC
        `;

        for (const sale of sales) {
          const items = await posDB.queryAll<{
            product_id: number;
            product_name: string;
            quantity: number;
            unit_price: number;
            total_price: number;
          }>`
            SELECT 
              si.product_id,
              p.name as product_name,
              si.quantity,
              si.unit_price,
              si.total_price
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ${sale.id}
          `;

          const receipt: Receipt = {
            id: sale.id,
            orderNumber: `ORD-${sale.id.toString().padStart(3, '0')}`,
            date: sale.created_at.toISOString().split('T')[0],
            time: sale.created_at.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            total: sale.total_amount,
            paymentMethod: sale.payment_method,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
            items: items.map(item => ({
              productId: item.product_id,
              productName: item.product_name,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              totalPrice: item.total_price
            }))
          };

          receipts.push(receipt);
        }
      }

      return {
        receipts,
        success: true
      };
    } catch (error) {
      console.error("Error searching receipts:", error);
      throw error;
    }
  }
);
