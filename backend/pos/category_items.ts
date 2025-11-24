import { api } from "encore.dev/api";
import { posDB } from "./db";

export interface CategoryItemsRequest {
  categoryId: number;
  startDate: Date;
  endDate: Date;
}

export interface CategoryItem {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_sales: number;
  sale_date: Date;
  sale_time: string;
}

export interface CategoryItemsResponse {
  items: CategoryItem[];
}

export const getCategoryItems = api(
  { expose: true, method: "POST", path: "/pos/category-items" },
  async ({ categoryId, startDate, endDate }: CategoryItemsRequest): Promise<CategoryItemsResponse> => {
    const result = await posDB.queryAll<{
      product_id: number;
      product_name: string;
      quantity: number;
      total_price: number;
      created_at: Date;
    }>`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        si.quantity,
        si.total_price,
        s.created_at
      FROM products p
      JOIN sale_items si ON si.product_id = p.id
      JOIN sales s ON s.id = si.sale_id
      WHERE p.category_id = ${categoryId}
        AND s.created_at >= ${startDate}
        AND s.created_at <= ${endDate}
      ORDER BY s.created_at DESC
    `;

    const items: CategoryItem[] = result.map(row => {
      const date = new Date(row.created_at);
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      
      return {
        product_id: row.product_id,
        product_name: row.product_name,
        total_quantity: Number(row.quantity),
        total_sales: Number(row.total_price),
        sale_date: date,
        sale_time: timeStr
      };
    });

    return { items };
  }
);
