import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import type { AuthData } from "../auth/auth";
import { secret } from "encore.dev/config";
import { posDB } from "./db";
import nodemailer from "nodemailer";

// Email service configuration using SMTP
const smtpHost = secret("SMTPHost");
const smtpPort = secret("SMTPPort");
const smtpUser = secret("SMTPUser");
const smtpPassword = secret("SMTPPassword");
const fromEmail = secret("FromEmail");

export interface SaleItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateSaleRequest {
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: string;
  promotion?: number;
  discount?: number;
  customReduce?: number;
  customDiscount?: number;
  printReceipt?: boolean;
  salesPerson?: string;
  remarks?: string;
}

export interface Sale {
  id: number;
  totalAmount: number;
  createdAt: Date;
  items: SaleItem[];
}

export interface CreateSaleResponse {
  sale: Sale;
  success: boolean;
}

export interface SalesSummaryRequest {
  dateFrom?: string;
  dateTo?: string;
  employeeFilter?: string;
}

export interface PaymentMethodSummary {
  method: string;
  amount: number;
  percentage: number;
}

export interface SalesSummaryData {
  totalSales: number;
  totalTransactions: number;
  totalQuantity: number;
  averageTransaction: number;
  paymentMethods: PaymentMethodSummary[];
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  hourlySales: Array<{
    hour: string;
    sales: number;
    transactions: number;
  }>;
}

export interface SalesSummaryResponse {
  data: SalesSummaryData;
  success: boolean;
}

export interface ExportSalesRequest {
  dateFrom?: string;
  dateTo?: string;
  employeeFilter?: string;
  format: "excel" | "csv";
  email: string;
}

export interface ExportSalesResponse {
  success: boolean;
  message: string;
  downloadUrl?: string;
}

// Creates a new sale transaction.
export const createSale = api<CreateSaleRequest, CreateSaleResponse>(
  { auth: true, expose: true, method: "POST", path: "/pos/sales" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    const tx = await posDB.begin();
    
    try {
      const sale = await tx.queryRow<{ id: number; total_amount: number; created_at: Date }>`
        INSERT INTO sales (total_amount, payment_method, custom_reduce, custom_discount, remarks, client_id)
        VALUES (${req.totalAmount}, ${req.paymentMethod}, ${req.customReduce || null}, ${req.customDiscount || null}, ${req.remarks || null}, ${auth.clientID})
        RETURNING id, total_amount, created_at
      `;

      if (!sale) {
        throw new Error("Failed to create sale");
      }

      // Create sale items
      const saleItems: SaleItem[] = [];
      for (const item of req.items) {
        await tx.exec`
          INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
          VALUES (${sale.id}, ${item.productId}, ${item.quantity}, ${item.unitPrice}, ${item.totalPrice})
        `;

        await tx.exec`
          UPDATE products 
          SET quantity = quantity - ${item.quantity}
          WHERE id = ${item.productId} AND client_id = ${auth.clientID}
        `;

        saleItems.push(item);
      }

      await tx.commit();

      return {
        sale: {
          id: sale.id,
          totalAmount: sale.total_amount,
          createdAt: sale.created_at,
          items: saleItems
        },
        success: true
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);

// Gets sales summary data for reporting.
export const getSalesSummary = api<SalesSummaryRequest, SalesSummaryResponse>(
  { auth: true, expose: true, method: "GET", path: "/pos/sales/summary" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    try {
      const dateFrom = req.dateFrom || new Date().toISOString().split('T')[0];
      const dateTo = req.dateTo || new Date().toISOString().split('T')[0];
      
      const salesSummary = await posDB.queryRow<{
        total_sales: number;
        total_transactions: number;
      }>`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_sales,
          COUNT(*) as total_transactions
        FROM sales 
        WHERE DATE(created_at) BETWEEN ${dateFrom} AND ${dateTo} AND client_id = ${auth.clientID}
      `;

      const totalSales = salesSummary?.total_sales || 0;
      const totalTransactions = salesSummary?.total_transactions || 0;
      const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      const quantitySummary = await posDB.queryRow<{ total_quantity: number }>`
        SELECT COALESCE(SUM(si.quantity), 0) as total_quantity
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE DATE(s.created_at) BETWEEN ${dateFrom} AND ${dateTo} AND s.client_id = ${auth.clientID}
      `;

      const totalQuantity = quantitySummary?.total_quantity || 0;

      const paymentMethodData = await posDB.queryAll<{
        payment_method: string;
        total_amount: number;
      }>`
        SELECT 
          COALESCE(payment_method, 'cash') as payment_method,
          SUM(total_amount) as total_amount
        FROM sales 
        WHERE DATE(created_at) BETWEEN ${dateFrom} AND ${dateTo} AND client_id = ${auth.clientID}
        GROUP BY payment_method
        ORDER BY total_amount DESC
      `;

      const paymentMethods: PaymentMethodSummary[] = paymentMethodData.map(pm => ({
        method: pm.payment_method,
        amount: pm.total_amount,
        percentage: totalSales > 0 ? (pm.total_amount / totalSales) * 100 : 0
      }));

      // If no payment methods found, add default structure
      if (paymentMethods.length === 0) {
        paymentMethods.push(
          { method: "cash", amount: 0, percentage: 0 },
          { method: "member", amount: 0, percentage: 0 },
          { method: "others", amount: 0, percentage: 0 }
        );
      }

      const topSellingItems = await posDB.queryAll<{
        product_name: string;
        total_quantity: number;
        total_revenue: number;
      }>`
        SELECT 
          p.name as product_name,
          SUM(si.quantity) as total_quantity,
          SUM(si.total_price) as total_revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE DATE(s.created_at) BETWEEN ${dateFrom} AND ${dateTo} AND s.client_id = ${auth.clientID}
        GROUP BY p.id, p.name
        ORDER BY total_revenue DESC
        LIMIT 5
      `;

      const hourlySales = await posDB.queryAll<{
        hour: string;
        sales: number;
        transactions: number;
      }>`
        SELECT 
          TO_CHAR(created_at, 'HH24:00') as hour,
          COALESCE(SUM(total_amount), 0) as sales,
          COUNT(*) as transactions
        FROM sales
        WHERE DATE(created_at) BETWEEN ${dateFrom} AND ${dateTo} AND client_id = ${auth.clientID}
        GROUP BY TO_CHAR(created_at, 'HH24:00')
        ORDER BY hour
      `;

      const summaryData: SalesSummaryData = {
        totalSales,
        totalTransactions,
        totalQuantity,
        averageTransaction,
        paymentMethods,
        topSellingItems: topSellingItems.map(item => ({
          name: item.product_name,
          quantity: item.total_quantity,
          revenue: item.total_revenue
        })),
        hourlySales: hourlySales.map(hour => ({
          hour: hour.hour,
          sales: hour.sales,
          transactions: hour.transactions
        }))
      };

      return {
        data: summaryData,
        success: true
      };
    } catch (error) {
      console.error("Error getting sales summary:", error);
      throw error;
    }
  }
);

// Exports sales data via email in Excel format.
export const exportSalesViaEmail = api<ExportSalesRequest, ExportSalesResponse>(
  { auth: true, expose: true, method: "POST", path: "/pos/sales/export-email" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.email)) {
        return {
          success: false,
          message: "Invalid email address format"
        };
      }

      // Set default date range to today if not provided
      const dateFrom = req.dateFrom || new Date().toISOString().split('T')[0];
      const dateTo = req.dateTo || new Date().toISOString().split('T')[0];
      
      // Get sales summary data
      const summaryResponse = await getSalesSummary({
        dateFrom,
        dateTo,
        employeeFilter: req.employeeFilter
      });

      if (!summaryResponse.success) {
        return {
          success: false,
          message: "Failed to generate sales summary data"
        };
      }

      const summaryData = summaryResponse.data;

      // Generate CSV content (simpler than Excel for now)
      const csvContent = generateCSVContent(summaryData, dateFrom, dateTo, req.employeeFilter);

      // Send email using Nodemailer with SMTP
      const emailSent = await sendEmailWithAttachment(
        req.email,
        "Sales Summary Report",
        `Please find attached the sales summary report for ${dateFrom} to ${dateTo}.`,
        csvContent,
        `sales-summary-${dateFrom}-to-${dateTo}.csv`
      );

      if (emailSent) {
        console.log(`Sales summary exported and sent to ${req.email} at ${new Date().toISOString()}`);
        
        return {
          success: true,
          message: `Sales summary report has been successfully sent to ${req.email}`
        };
      } else {
        console.error(`Failed to send sales summary to ${req.email} at ${new Date().toISOString()}`);
        
        return {
          success: false,
          message: "Failed to send email. Please check the email address and try again."
        };
      }
    } catch (error) {
      console.error("Error exporting sales via email:", error);
      return {
        success: false,
        message: "An error occurred while processing the export request"
      };
    }
  }
);

// Generate CSV content from sales data
function generateCSVContent(
  summaryData: SalesSummaryData, 
  dateFrom: string, 
  dateTo: string, 
  employeeFilter?: string
): string {
  const lines: string[] = [];
  
  // Header
  lines.push("Sales Summary Report");
  lines.push(`Period: ${dateFrom} to ${dateTo}`);
  lines.push(`Employee: ${employeeFilter || "All Employees"}`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");
  
  // Summary metrics
  lines.push("SUMMARY METRICS");
  lines.push("Metric,Value");
  lines.push(`Total Quantity,${summaryData.totalQuantity}`);
  lines.push(`Total Income,$${summaryData.totalSales.toFixed(2)}`);
  lines.push(`Total Transactions,${summaryData.totalTransactions}`);
  lines.push(`Average Transaction,$${summaryData.averageTransaction.toFixed(2)}`);
  lines.push("");
  
  // Payment methods
  lines.push("PAYMENT METHODS");
  lines.push("Payment Method,Amount,Percentage");
  summaryData.paymentMethods.forEach(pm => {
    lines.push(`${getPaymentMethodLabel(pm.method)},$${pm.amount.toFixed(2)},${pm.percentage.toFixed(1)}%`);
  });
  lines.push("");
  
  // Top selling items
  lines.push("TOP SELLING ITEMS");
  lines.push("Item Name,Quantity Sold,Revenue");
  summaryData.topSellingItems.forEach(item => {
    lines.push(`"${item.name}",${item.quantity},$${item.revenue.toFixed(2)}`);
  });
  lines.push("");
  
  // Hourly sales
  lines.push("HOURLY SALES");
  lines.push("Hour,Sales,Transactions");
  summaryData.hourlySales.forEach(hour => {
    lines.push(`${hour.hour},$${hour.sales.toFixed(2)},${hour.transactions}`);
  });
  
  return lines.join("\n");
}

async function sendEmailWithAttachment(
  toEmail: string,
  subject: string,
  content: string,
  attachmentContent: string,
  attachmentFilename: string
): Promise<boolean> {
  try {
    const host = smtpHost();
    const port = parseInt(smtpPort());
    const user = smtpUser();
    const password = smtpPassword();
    const from = fromEmail();
    
    if (!host || !port || !user || !password || !from) {
      console.error("SMTP configuration not complete. Required: SMTPHost, SMTPPort, SMTPUser, SMTPPassword, FromEmail");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465,
      auth: {
        user: user,
        pass: password
      }
    });

    const mailOptions = {
      from: from,
      to: toEmail,
      subject: subject,
      text: content,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Sales Summary Report</h2>
          <p>${content}</p>
          <p style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <strong>Note:</strong> This report contains your sales data in CSV format. 
            You can open it with Excel, Google Sheets, or any spreadsheet application.
          </p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">
            This email was automatically generated by your POS system.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: attachmentFilename,
          content: attachmentContent,
          contentType: 'text/csv'
        }
      ]
    };

    console.log(`Attempting to send email to ${toEmail} via SMTP server ${host}:${port}`);
    
    await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully to ${toEmail} via ${host}`);
    return true;
  } catch (error) {
    console.error("Error sending email via SMTP:", error);
    return false;
  }
}

// Helper function to get payment method labels
function getPaymentMethodLabel(method: string): string {
  switch (method.toLowerCase()) {
    case "cash":
      return "Cash Income";
    case "member":
      return "Member";
    case "others":
      return "Other Revenue";
    default:
      return method;
  }
}
