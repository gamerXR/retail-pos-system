import { api } from "encore.dev/api";
import { posDB } from "./db";

export interface CategorySalesReportRequest {
  startDate: Date;
  endDate: Date;
}

export interface CategorySales {
  category_id: number;
  category_name: string;
  total_quantity: number;
  total_sales: number;
}

export interface CategorySalesReportResponse {
  categories: CategorySales[];
}

export const getCategorySalesReport = api(
  { expose: true, method: "POST", path: "/pos/category-sales-report" },
  async ({ startDate, endDate }: CategorySalesReportRequest): Promise<CategorySalesReportResponse> => {
    const result = await posDB.queryAll<{
      category_id: number;
      category_name: string;
      total_quantity: number;
      total_sales: number;
    }>`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COALESCE(SUM(si.quantity), 0) as total_quantity,
        COALESCE(SUM(si.total_price), 0) as total_sales
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      LEFT JOIN sale_items si ON si.product_id = p.id
      LEFT JOIN sales s ON s.id = si.sale_id
      WHERE s.created_at >= ${startDate} 
        AND s.created_at <= ${endDate}
        OR s.id IS NULL
      GROUP BY c.id, c.name
      HAVING COALESCE(SUM(si.quantity), 0) > 0
      ORDER BY total_sales DESC
    `;

    const categories: CategorySales[] = result.map(row => ({
      category_id: row.category_id,
      category_name: row.category_name,
      total_quantity: Number(row.total_quantity),
      total_sales: Number(row.total_sales)
    }));

    return { categories };
  }
);
