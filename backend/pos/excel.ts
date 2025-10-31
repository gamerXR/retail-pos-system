import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import type { AuthData } from "../auth/auth";
import { posDB } from "./db";

export interface ProductExcelRow {
  name: string;
  price: number;
  quantity?: number;
  categoryName?: string;
  barcode?: string;
  secondName?: string;
  wholesalePrice?: number;
  stockPrice?: number;
  origin?: string;
  ingredients?: string;
  remarks?: string;
}

export interface ImportProductsRequest {
  products: ProductExcelRow[];
  updateExisting?: boolean;
}

export interface ImportProductsResponse {
  imported: number;
  updated: number;
  errors: string[];
}

export interface ExportProductsResponse {
  products: ProductExcelRow[];
}

export const importProducts = api<ImportProductsRequest, ImportProductsResponse>(
  { auth: true, expose: true, method: "POST", path: "/pos/products/import" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    let imported = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const row of req.products) {
      try {
        if (!row.name || !row.price || isNaN(row.price)) {
          errors.push(`Row skipped: Missing required fields (name or price)`);
          continue;
        }

        let categoryId: number | null = null;
        if (row.categoryName) {
          const category = await posDB.queryRow<{ id: number }>`
            SELECT id FROM categories 
            WHERE LOWER(name) = LOWER(${row.categoryName}) AND client_id = ${auth.clientID}
          `;

          if (!category) {
            const newCategory = await posDB.queryRow<{ id: number }>`
              INSERT INTO categories (name, client_id)
              VALUES (${row.categoryName}, ${auth.clientID})
              RETURNING id
            `;
            categoryId = newCategory?.id || null;
          } else {
            categoryId = category.id;
          }
        }

        const existingProduct = await posDB.queryRow<{ id: number }>`
          SELECT id FROM products 
          WHERE client_id = ${auth.clientID}
            AND (
              LOWER(name) = LOWER(${row.name})
              ${row.barcode ? `OR barcode = ${row.barcode}` : ''}
            )
        `;

        if (existingProduct) {
          if (req.updateExisting) {
            await posDB.exec`
              UPDATE products SET
                name = ${row.name},
                price = ${row.price},
                quantity = COALESCE(${row.quantity ?? null}, quantity),
                category_id = ${categoryId ?? null},
                barcode = COALESCE(${row.barcode ?? null}, barcode),
                second_name = COALESCE(${row.secondName ?? null}, second_name),
                wholesale_price = COALESCE(${row.wholesalePrice ?? null}, wholesale_price),
                stock_price = COALESCE(${row.stockPrice ?? null}, stock_price),
                origin = COALESCE(${row.origin ?? null}, origin),
                ingredients = COALESCE(${row.ingredients ?? null}, ingredients),
                remarks = COALESCE(${row.remarks ?? null}, remarks)
              WHERE id = ${existingProduct.id}
            `;
            updated++;
          } else {
            errors.push(`Product "${row.name}" already exists and was skipped`);
          }
        } else {
          const quantity = row.quantity || 0;
          await posDB.exec`
            INSERT INTO products (
              name, price, quantity, category_id, barcode, second_name, 
              wholesale_price, stock_price, origin, ingredients, remarks,
              start_qty, is_off_shelf, sort_order, client_id
            )
            VALUES (
              ${row.name}, 
              ${row.price}::numeric, 
              ${quantity}::integer, 
              ${categoryId}::integer,
              ${row.barcode ?? null}, 
              ${row.secondName ?? null},
              ${row.wholesalePrice ?? null}::numeric, 
              ${row.stockPrice ?? null}::numeric, 
              ${row.origin ?? null}, 
              ${row.ingredients ?? null}, 
              ${row.remarks ?? null},
              ${quantity}::integer, 
              FALSE, 
              0, 
              ${auth.clientID}
            )
          `;
          imported++;
        }
      } catch (error: any) {
        errors.push(`Error processing "${row.name}": ${error.message}`);
      }
    }

    return { imported, updated, errors };
  }
);

export const exportProducts = api<void, ExportProductsResponse>(
  { auth: true, expose: true, method: "GET", path: "/pos/products/export" },
  async () => {
    const auth = getAuthData()! as AuthData;
    
    const productsData = await posDB.queryAll<{
      name: string;
      price: number;
      quantity: number;
      categoryName: string | null;
      barcode: string | null;
      secondName: string | null;
      wholesalePrice: number | null;
      stockPrice: number | null;
      origin: string | null;
      ingredients: string | null;
      remarks: string | null;
    }>`
      SELECT 
        p.name,
        p.price,
        p.quantity,
        c.name as "categoryName",
        p.barcode,
        p.second_name as "secondName",
        p.wholesale_price as "wholesalePrice",
        p.stock_price as "stockPrice",
        p.origin,
        p.ingredients,
        p.remarks
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.client_id = ${auth.clientID}
      ORDER BY c.name, p.name
    `;

    const products: ProductExcelRow[] = productsData.map(p => ({
      name: p.name,
      price: p.price,
      quantity: p.quantity,
      categoryName: p.categoryName || undefined,
      barcode: p.barcode || undefined,
      secondName: p.secondName || undefined,
      wholesalePrice: p.wholesalePrice || undefined,
      stockPrice: p.stockPrice || undefined,
      origin: p.origin || undefined,
      ingredients: p.ingredients || undefined,
      remarks: p.remarks || undefined,
    }));

    return { products };
  }
);
