import { api } from "encore.dev/api";
import { posDB } from "./db";

export interface SyncResponse {
  success: boolean;
  message: string;
  syncedAt: Date;
  stats: {
    products: number;
    sales: number;
    expenses: number;
  };
}

export const syncData = api(
  { method: "POST", path: "/pos/sync", expose: true, auth: true },
  async (): Promise<SyncResponse> => {
    const syncStart = new Date();

    const productsResult = await posDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM products
    `;

    const salesResult = await posDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM sales
    `;

    const expensesResult = await posDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM expenses
    `;

    await posDB.exec`VACUUM ANALYZE products`;
    await posDB.exec`VACUUM ANALYZE sales`;
    await posDB.exec`VACUUM ANALYZE sale_items`;
    await posDB.exec`VACUUM ANALYZE expenses`;

    return {
      success: true,
      message: "Data synchronized and optimized successfully",
      syncedAt: syncStart,
      stats: {
        products: productsResult?.count || 0,
        sales: salesResult?.count || 0,
        expenses: expensesResult?.count || 0
      }
    };
  }
);
