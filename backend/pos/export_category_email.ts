import { api } from "encore.dev/api";
import { posDB } from "./db";
import * as emailService from "../email/send";

export interface ExportCategorySalesRequest {
  startDate: Date;
  endDate: Date;
  categoryId?: number;
  email: string;
}

export interface ExportCategorySalesResponse {
  success: boolean;
  message: string;
}

export const exportCategorySalesViaEmail = api(
  { expose: true, method: "POST", path: "/pos/export-category-sales-email" },
  async ({ startDate, endDate, categoryId, email: recipientEmail }: ExportCategorySalesRequest): Promise<ExportCategorySalesResponse> => {
    try {
      let categorySalesData: any[];
      let subject: string;
      let bodyHtml: string;

      if (categoryId) {
        const items = await posDB.queryAll<{
          product_name: string;
          quantity: number;
          total_price: number;
          created_at: Date;
        }>`
          SELECT 
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

        const category = await posDB.queryRow<{ name: string }>`
          SELECT name FROM categories WHERE id = ${categoryId}
        `;

        categorySalesData = items.map(row => {
          const date = new Date(row.created_at);
          return {
            product_name: row.product_name,
            quantity: Number(row.quantity),
            total_price: Number(row.total_price),
            sale_date: date.toLocaleDateString(),
            sale_time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          };
        });

        const totalQuantity = categorySalesData.reduce((sum, item) => sum + item.quantity, 0);
        const totalSales = categorySalesData.reduce((sum, item) => sum + item.total_price, 0);

        subject = `${category?.name || 'Category'} Sales Report`;
        bodyHtml = `
          <h2>${category?.name || 'Category'} Sales Report</h2>
          <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
          <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th>Product Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Quantity</th>
                <th>Total Sales</th>
              </tr>
            </thead>
            <tbody>
              ${categorySalesData.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.sale_date}</td>
                  <td>${item.sale_time}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.total_price.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f3f4f6; font-weight: bold;">
                <td colspan="3">Total</td>
                <td>${totalQuantity}</td>
                <td>$${totalSales.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        `;
      } else {
        const categories = await posDB.queryAll<{
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
          WHERE (s.created_at >= ${startDate} AND s.created_at <= ${endDate})
             OR s.id IS NULL
          GROUP BY c.id, c.name
          ORDER BY total_sales DESC
        `;

        categorySalesData = categories.map(row => ({
          category_name: row.category_name,
          total_quantity: Number(row.total_quantity),
          total_sales: Number(row.total_sales)
        }));

        const totalQuantity = categorySalesData.reduce((sum, item) => sum + item.total_quantity, 0);
        const totalSales = categorySalesData.reduce((sum, item) => sum + item.total_sales, 0);

        subject = 'All Categories Sales Report';
        bodyHtml = `
          <h2>All Categories Sales Report</h2>
          <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
          <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th>Category</th>
                <th>Quantity Sold</th>
                <th>Total Sales</th>
              </tr>
            </thead>
            <tbody>
              ${categorySalesData.map(item => `
                <tr>
                  <td>${item.category_name}</td>
                  <td>${item.total_quantity}</td>
                  <td>$${item.total_sales.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f3f4f6; font-weight: bold;">
                <td>Total</td>
                <td>${totalQuantity}</td>
                <td>$${totalSales.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        `;
      }

      await emailService.send({
        to: recipientEmail,
        subject: subject,
        htmlContent: bodyHtml
      });

      return {
        success: true,
        message: `Report successfully sent to ${recipientEmail}`
      };
    } catch (error) {
      console.error("Error exporting category sales via email:", error);
      return {
        success: false,
        message: "Failed to send email. Please try again later."
      };
    }
  }
);
