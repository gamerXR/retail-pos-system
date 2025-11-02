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
      total_quantity: number;
      total_sales: number;
    }>`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        SUM(si.quantity) as total_quantity,
        SUM(si.total_price) as total_sales
      FROM products p
      JOIN sale_items si ON si.product_id = p.id
      JOIN sales s ON s.id = si.sale_id
      WHERE p.category_id = ${categoryId}
        AND s.created_at >= ${startDate}
        AND s.created_at <= ${endDate}
      GROUP BY p.id, p.name
      ORDER BY total_sales DESC
    `;

    const items: CategoryItem[] = result.map(row => ({
      product_id: row.product_id,
      product_name: row.product_name,
      total_quantity: Number(row.total_quantity),
      total_sales: Number(row.total_sales)
    }));

    return { items };
  }
);
