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

        // Log stock movement (optional - you can create a stock_movements table later)
        // For now, we'll just track the updated products
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
