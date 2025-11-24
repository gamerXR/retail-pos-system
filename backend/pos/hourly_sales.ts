import { api } from "encore.dev/api";
import { posDB } from "./db";

export interface HourlySalesRequest {
  startDate: Date;
  endDate: Date;
}

export interface HourlyItem {
  product_name: string;
  quantity: number;
  total_sales: number;
}

export interface HourlySalesData {
  hour: string;
  hour_24: number;
  total_sales: number;
  transaction_count: number;
  items: HourlyItem[];
}

export interface HourlySalesResponse {
  hourlyData: HourlySalesData[];
}

export const getHourlySales = api(
  { expose: true, method: "POST", path: "/pos/hourly-sales" },
  async ({ startDate, endDate }: HourlySalesRequest): Promise<HourlySalesResponse> => {
    const hourlySales = await posDB.queryAll<{
      hour_24: number;
      total_sales: number;
      transaction_count: number;
    }>`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour_24,
        SUM(total_amount) as total_sales,
        COUNT(*) as transaction_count
      FROM sales
      WHERE created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour_24
    `;

    const hourlyData: HourlySalesData[] = [];

    for (const hourData of hourlySales) {
      const hour24 = Number(hourData.hour_24);
      const hourStart = new Date(startDate);
      hourStart.setHours(hour24, 0, 0, 0);
      const hourEnd = new Date(startDate);
      hourEnd.setHours(hour24, 59, 59, 999);

      const items = await posDB.queryAll<{
        product_name: string;
        quantity: number;
        total_sales: number;
      }>`
        SELECT 
          p.name as product_name,
          SUM(si.quantity) as quantity,
          SUM(si.total_price) as total_sales
        FROM sale_items si
        JOIN products p ON p.id = si.product_id
        JOIN sales s ON s.id = si.sale_id
        WHERE s.created_at >= ${startDate}
          AND s.created_at <= ${endDate}
          AND EXTRACT(HOUR FROM s.created_at) = ${hour24}
        GROUP BY p.name
        ORDER BY total_sales DESC
      `;

      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const period = hour24 < 12 ? 'AM' : 'PM';
      const hourString = `${hour12}:00 ${period}`;

      hourlyData.push({
        hour: hourString,
        hour_24: hour24,
        total_sales: Number(hourData.total_sales),
        transaction_count: Number(hourData.transaction_count),
        items: items.map(item => ({
          product_name: item.product_name,
          quantity: Number(item.quantity),
          total_sales: Number(item.total_sales)
        }))
      });
    }

    return { hourlyData };
  }
);
