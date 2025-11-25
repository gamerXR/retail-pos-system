import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { posDB } from "./db";

export interface ClientDashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockItems: number;
}

export interface SalesReportItem {
  date: string;
  totalSales: number;
  totalRevenue: number;
  cashSales: number;
  qrSales: number;
  otherSales: number;
}

export interface CategorySalesItem {
  categoryId: number;
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
  itemCount: number;
}

export interface TopSellingProduct {
  productId: number;
  productName: string;
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
  stockQuantity: number;
}

export interface DateRangeRequest {
  startDate: string;
  endDate: string;
}

export const getClientDashboard = api<void, ClientDashboardStats>(
  { auth: true, expose: true, method: "GET", path: "/pos/client/dashboard" },
  async () => {
    const authData = getAuthData()!;
    const clientId = authData.clientID;

    const salesStats = await posDB.queryRow<{
      total_sales: number | null;
      total_revenue: number | null;
    }>`
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total), 0) as total_revenue
      FROM sales
      WHERE client_id = ${clientId}
    `;

    const productStats = await posDB.queryRow<{
      total_products: number | null;
      low_stock: number | null;
    }>`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN stock_quantity < min_stock_level THEN 1 END) as low_stock
      FROM products
      WHERE client_id = ${clientId} AND status = 'active'
    `;

    return {
      totalSales: Number(salesStats?.total_sales || 0),
      totalRevenue: Number(salesStats?.total_revenue || 0),
      totalProducts: Number(productStats?.total_products || 0),
      lowStockItems: Number(productStats?.low_stock || 0)
    };
  }
);

export const getClientSalesReport = api<DateRangeRequest, { sales: SalesReportItem[] }>(
  { auth: true, expose: true, method: "POST", path: "/pos/client/sales-report" },
  async (req) => {
    const authData = getAuthData()!;
    const clientId = authData.clientID;

    const sales = await posDB.queryAll<{
      date: string;
      total_sales: number;
      total_revenue: number;
      cash_sales: number;
      qr_sales: number;
      other_sales: number;
    }>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_sales,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'qr' THEN total ELSE 0 END), 0) as qr_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'other' THEN total ELSE 0 END), 0) as other_sales
      FROM sales
      WHERE client_id = ${clientId}
        AND created_at >= ${req.startDate}::timestamp
        AND created_at <= ${req.endDate}::timestamp
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return {
      sales: sales.map(s => ({
        date: s.date,
        totalSales: Number(s.total_sales),
        totalRevenue: Number(s.total_revenue),
        cashSales: Number(s.cash_sales),
        qrSales: Number(s.qr_sales),
        otherSales: Number(s.other_sales)
      }))
    };
  }
);

export const getClientCategorySales = api<DateRangeRequest, { categories: CategorySalesItem[] }>(
  { auth: true, expose: true, method: "POST", path: "/pos/client/category-sales" },
  async (req) => {
    const authData = getAuthData()!;
    const clientId = authData.clientID;

    const categories = await posDB.queryAll<{
      category_id: number;
      category_name: string;
      total_quantity: number;
      total_revenue: number;
      item_count: number;
    }>`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COALESCE(SUM(si.quantity), 0) as total_quantity,
        COALESCE(SUM(si.quantity * si.price), 0) as total_revenue,
        COUNT(DISTINCT si.product_id) as item_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.client_id = ${clientId}
      LEFT JOIN sale_items si ON si.product_id = p.id
      LEFT JOIN sales s ON s.id = si.sale_id 
        AND s.created_at >= ${req.startDate}::timestamp
        AND s.created_at <= ${req.endDate}::timestamp
      WHERE c.client_id = ${clientId}
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
    `;

    return {
      categories: categories.map(c => ({
        categoryId: c.category_id,
        categoryName: c.category_name,
        totalQuantity: Number(c.total_quantity),
        totalRevenue: Number(c.total_revenue),
        itemCount: Number(c.item_count)
      }))
    };
  }
);

export const getClientTopProducts = api<DateRangeRequest, { products: TopSellingProduct[] }>(
  { auth: true, expose: true, method: "POST", path: "/pos/client/top-products" },
  async (req) => {
    const authData = getAuthData()!;
    const clientId = authData.clientID;

    const products = await posDB.queryAll<{
      product_id: number;
      product_name: string;
      category_name: string;
      total_quantity: number;
      total_revenue: number;
      stock_quantity: number;
    }>`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        c.name as category_name,
        COALESCE(SUM(si.quantity), 0) as total_quantity,
        COALESCE(SUM(si.quantity * si.price), 0) as total_revenue,
        p.stock_quantity
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN sale_items si ON si.product_id = p.id
      LEFT JOIN sales s ON s.id = si.sale_id 
        AND s.created_at >= ${req.startDate}::timestamp
        AND s.created_at <= ${req.endDate}::timestamp
      WHERE p.client_id = ${clientId}
      GROUP BY p.id, p.name, c.name, p.stock_quantity
      HAVING SUM(si.quantity) > 0
      ORDER BY total_revenue DESC
      LIMIT 20
    `;

    return {
      products: products.map(p => ({
        productId: p.product_id,
        productName: p.product_name,
        categoryName: p.category_name,
        totalQuantity: Number(p.total_quantity),
        totalRevenue: Number(p.total_revenue),
        stockQuantity: p.stock_quantity
      }))
    };
  }
);

export interface CashflowSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  openingBalance: number;
  closingBalance: number;
  cashSales: number;
  qrSales: number;
  otherSales: number;
}

export const getClientCashflow = api<DateRangeRequest, CashflowSummary>(
  { auth: true, expose: true, method: "POST", path: "/pos/client/cashflow" },
  async (req) => {
    const authData = getAuthData()!;
    const clientId = authData.clientID;

    const income = await posDB.queryRow<{
      cash_sales: number | null;
      qr_sales: number | null;
      other_sales: number | null;
    }>`
      SELECT 
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'qr' THEN total ELSE 0 END), 0) as qr_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'other' THEN total ELSE 0 END), 0) as other_sales
      FROM sales
      WHERE client_id = ${clientId}
        AND created_at >= ${req.startDate}::timestamp
        AND created_at <= ${req.endDate}::timestamp
    `;

    const expenses = await posDB.queryRow<{
      total_expenses: number | null;
    }>`
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses
      WHERE client_id = ${clientId}
        AND created_at >= ${req.startDate}::timestamp
        AND created_at <= ${req.endDate}::timestamp
    `;

    const openingBalance = await posDB.queryRow<{
      amount: number | null;
    }>`
      SELECT amount
      FROM opening_balance
      WHERE client_id = ${clientId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const cashSales = Number(income?.cash_sales || 0);
    const qrSales = Number(income?.qr_sales || 0);
    const otherSales = Number(income?.other_sales || 0);
    const totalIncome = cashSales + qrSales + otherSales;
    const totalExpenses = Number(expenses?.total_expenses || 0);
    const opening = Number(openingBalance?.amount || 0);

    return {
      totalIncome,
      totalExpenses,
      netCashflow: totalIncome - totalExpenses,
      openingBalance: opening,
      closingBalance: opening + totalIncome - totalExpenses,
      cashSales,
      qrSales,
      otherSales
    };
  }
);
