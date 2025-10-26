import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import type { AuthData } from "../auth/auth";
import { posDB } from "./db";

export interface StockUpdateRequest {
  productId: number;
  quantity: number;
  action: "stock-in" | "stock-out" | "stock-loss";
  price?: number;
  remarks?: string;
}

export interface BulkStockUpdateRequest {
  updates: StockUpdateRequest[];
}

export interface StockUpdateResponse {
  success: boolean;
  updatedProducts: number[];
}

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  action: string;
  price?: number;
  remarks?: string;
  employee: string;
  createdAt: string;
  originalQuantity: number;
  currentQuantity: number;
}

export interface StockHistoryRequest {
  startDate?: string;
  endDate?: string;
  shift?: string;
  employee?: string;
  reason?: string;
  itemId?: number;
}

export interface StockHistoryResponse {
  movements: StockMovement[];
}

export interface LowStockItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

export interface LowStockResponse {
  items: LowStockItem[];
}

// Updates stock for multiple products.
export const updateStock = api<BulkStockUpdateRequest, StockUpdateResponse>(
  { auth: true, expose: true, method: "POST", path: "/pos/stock/update" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    const tx = await posDB.begin();
    const updatedProducts: number[] = [];
    
    try {
      for (const update of req.updates) {
        const product = await tx.queryRow<{ id: number; quantity: number }>`
          SELECT id, quantity FROM products WHERE id = ${update.productId} AND client_id = ${auth.clientID}
        `;

        if (!product) {
          throw APIError.notFound(`Product with ID ${update.productId} not found`);
        }

        let newQuantity = product.quantity;
        
        // Calculate new quantity based on action
        switch (update.action) {
          case "stock-in":
            // Stock In: Add to inventory (increase quantity)
            newQuantity += update.quantity;
            break;
          case "stock-out":
            // Stock Out: Remove from inventory (decrease quantity)
            newQuantity -= update.quantity;
            if (newQuantity < 0) {
              throw APIError.invalidArgument(`Insufficient stock for product ID ${update.productId}. Current: ${product.quantity}, Requested: ${update.quantity}`);
            }
            break;
          case "stock-loss":
            // Stock Loss: Remove from inventory due to damage (decrease quantity)
            newQuantity -= update.quantity;
            if (newQuantity < 0) {
              throw APIError.invalidArgument(`Insufficient stock for product ID ${update.productId}. Current: ${product.quantity}, Requested: ${update.quantity}`);
            }
            break;
        }

        await tx.exec`
          UPDATE products 
          SET quantity = ${newQuantity}
          WHERE id = ${update.productId} AND client_id = ${auth.clientID}
        `;

        await tx.exec`
          INSERT INTO stock_movements (product_id, client_id, quantity, action, price, remarks, employee)
          VALUES (${update.productId}, ${auth.clientID}, ${update.quantity}, ${update.action}, ${update.price || 0}, ${update.remarks || ''}, ${auth.phoneNumber})
        `;

        updatedProducts.push(update.productId);
      }

      await tx.commit();

      return {
        success: true,
        updatedProducts
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);

export const getStockHistory = api<StockHistoryRequest, StockHistoryResponse>(
  { auth: true, expose: true, method: "POST", path: "/pos/stock/history" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    
    const movements = await posDB.query<{
      id: number;
      product_id: number;
      product_name: string;
      quantity: number;
      action: string;
      price: number | null;
      remarks: string | null;
      employee: string;
      employee_name: string;
      created_at: Date;
      original_quantity: number;
      current_quantity: number;
    }>`
      SELECT 
        sm.id,
        sm.product_id,
        p.name as product_name,
        sm.quantity,
        sm.action,
        sm.price,
        sm.remarks,
        sm.employee,
        COALESCE(c.client_name, sm.employee) as employee_name,
        sm.created_at,
        0 as original_quantity,
        p.quantity as current_quantity
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN auth.clients c ON sm.employee = c.phone_number
      WHERE sm.client_id = ${auth.clientID.toString()}
      ORDER BY sm.created_at DESC
    `;

    const results: StockMovement[] = [];
    for await (const m of movements) {
      let include = true;
      
      if (req.startDate) {
        const startDate = new Date(req.startDate);
        if (m.created_at < startDate) include = false;
      }
      
      if (req.endDate) {
        const endDate = new Date(req.endDate);
        if (m.created_at > endDate) include = false;
      }
      
      if (req.employee && req.employee !== 'All' && m.employee !== req.employee) {
        include = false;
      }
      
      if (req.reason && req.reason !== 'All' && m.action !== req.reason) {
        include = false;
      }
      
      if (req.itemId && m.product_id !== req.itemId) {
        include = false;
      }
      
      if (include) {
        results.push({
          id: m.id,
          productId: m.product_id,
          productName: m.product_name,
          quantity: m.quantity,
          action: m.action,
          price: m.price || undefined,
          remarks: m.remarks || undefined,
          employee: m.employee_name,
          createdAt: m.created_at.toISOString(),
          originalQuantity: m.original_quantity,
          currentQuantity: m.current_quantity
        });
      }
    }

    return {
      movements: results
    };
  }
);

export const getLowStock = api<void, LowStockResponse>(
  { auth: true, expose: true, method: "GET", path: "/pos/stock/low" },
  async () => {
    const auth = getAuthData()! as AuthData;
    
    const items = await posDB.query<{
      id: number;
      name: string;
      quantity: number;
      price: number;
    }>`
      SELECT id, name, quantity, price
      FROM products
      WHERE client_id = ${auth.clientID} AND quantity <= 5
      ORDER BY quantity ASC, name ASC
    `;

    const results: LowStockItem[] = [];
    for await (const item of items) {
      results.push({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      });
    }

    return {
      items: results
    };
  }
);
