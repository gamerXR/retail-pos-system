import { api } from "encore.dev/api";
import { posDB } from "./db";

export interface TopSalesRequest {
  startDate: Date;
  endDate: Date;
  filterType?: "all" | "item" | "category";
  categoryId?: number;
}

export interface TopSalesItem {
  product_id: number;
  product_name: string;
  category_name: string;
  total_quantity: number;
  total_sales: number;
  transaction_count: number;
}

export interface TopSalesResponse {
  items: TopSalesItem[];
}

export const getTopSales = api(
  { expose: true, method: "POST", path: "/pos/top-sales" },
  async ({ startDate, endDate, filterType = "all", categoryId }: TopSalesRequest): Promise<TopSalesResponse> => {
    let query: string;
    let params: any[];

    if (filterType === "category" && categoryId) {
      query = `
        SELECT 
          p.id as product_id,
          p.name as product_name,
          c.name as category_name,
          SUM(si.quantity) as total_quantity,
          SUM(si.total_price) as total_sales,
          COUNT(DISTINCT s.id) as transaction_count
        FROM products p
        JOIN categories c ON c.id = p.category_id
        JOIN sale_items si ON si.product_id = p.id
        JOIN sales s ON s.id = si.sale_id
        WHERE s.created_at >= $1
          AND s.created_at <= $2
          AND p.category_id = $3
        GROUP BY p.id, p.name, c.name
        ORDER BY total_sales DESC
        LIMIT 50
      `;
      params = [startDate, endDate, categoryId];
    } else {
      query = `
        SELECT 
          p.id as product_id,
          p.name as product_name,
          c.name as category_name,
          SUM(si.quantity) as total_quantity,
          SUM(si.total_price) as total_sales,
          COUNT(DISTINCT s.id) as transaction_count
        FROM products p
        JOIN categories c ON c.id = p.category_id
        JOIN sale_items si ON si.product_id = p.id
        JOIN sales s ON s.id = si.sale_id
        WHERE s.created_at >= $1
          AND s.created_at <= $2
        GROUP BY p.id, p.name, c.name
        ORDER BY total_sales DESC
        LIMIT 50
      `;
      params = [startDate, endDate];
    }

    const result = await posDB.queryAll<{
      product_id: number;
      product_name: string;
      category_name: string;
      total_quantity: number;
      total_sales: number;
      transaction_count: number;
    }>(query as any, ...params);

    const items: TopSalesItem[] = result.map(row => ({
      product_id: row.product_id,
      product_name: row.product_name,
      category_name: row.category_name,
      total_quantity: Number(row.total_quantity),
      total_sales: Number(row.total_sales),
      transaction_count: Number(row.transaction_count)
    }));

    return { items };
  }
);
