import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import type { AuthData } from "../auth/auth";
import { posDB } from "./db";

export interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  categoryId?: number;
  barcode?: string;
  sku?: string;
  secondName?: string;
  wholesalePrice?: number;
  startQty?: number;
  stockPrice?: number;
  totalAmount?: number;
  shelfLife?: number;
  origin?: string;
  ingredients?: string;
  remarks?: string;
  weighing?: boolean;
  isOffShelf?: boolean;
  sortOrder?: number;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  quantity?: number;
  categoryId?: number;
  barcode?: string;
  sku?: string;
  secondName?: string;
  wholesalePrice?: number;
  startQty?: number;
  stockPrice?: number;
  totalAmount?: number;
  shelfLife?: number;
  origin?: string;
  ingredients?: string;
  remarks?: string;
  weighing?: boolean;
}

export interface UpdateProductRequest {
  id: number;
  name?: string;
  price?: number;
  quantity?: number;
  categoryId?: number;
  barcode?: string;
  sku?: string;
  secondName?: string;
  wholesalePrice?: number;
  startQty?: number;
  stockPrice?: number;
  totalAmount?: number;
  shelfLife?: number;
  origin?: string;
  ingredients?: string;
  remarks?: string;
  weighing?: boolean;
}

export interface ProductsResponse {
  products: Product[];
}

export interface ProductsByCategoryResponse {
  products: Product[];
}

// Gets all products.
export const getProducts = api<void, ProductsResponse>(
  { auth: true, expose: true, method: "GET", path: "/pos/products" },
  async () => {
    const auth = getAuthData()! as AuthData;
    const products = await posDB.queryAll<Product>`
      SELECT 
        id, name, price, quantity, category_id as "categoryId",
        barcode, sku, second_name as "secondName", wholesale_price as "wholesalePrice",
        start_qty as "startQty", stock_price as "stockPrice", total_amount as "totalAmount",
        shelf_life as "shelfLife", origin, ingredients, remarks, weighing,
        is_off_shelf as "isOffShelf", sort_order as "sortOrder"
      FROM products
      WHERE client_id = ${auth.clientID}
      ORDER BY sort_order DESC, name
    `;

    return { products };
  }
);

// Gets products by category.
export const getProductsByCategory = api<{ categoryId: number }, ProductsByCategoryResponse>(
  { auth: true, expose: true, method: "GET", path: "/pos/products/category/:categoryId" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    const products = await posDB.queryAll<Product>`
      SELECT 
        id, name, price, quantity, category_id as "categoryId",
        barcode, sku, second_name as "secondName", wholesale_price as "wholesalePrice",
        start_qty as "startQty", stock_price as "stockPrice", total_amount as "totalAmount",
        shelf_life as "shelfLife", origin, ingredients, remarks, weighing,
        is_off_shelf as "isOffShelf", sort_order as "sortOrder"
      FROM products
      WHERE category_id = ${req.categoryId} AND client_id = ${auth.clientID}
      ORDER BY sort_order DESC, name
    `;

    return { products };
  }
);

// Gets a single product by ID.
export const getProduct = api<{ id: number }, Product>(
  { auth: true, expose: true, method: "GET", path: "/pos/products/:id" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    const product = await posDB.queryRow<Product>`
      SELECT 
        id, name, price, quantity, category_id as "categoryId",
        barcode, sku, second_name as "secondName", wholesale_price as "wholesalePrice",
        start_qty as "startQty", stock_price as "stockPrice", total_amount as "totalAmount",
        shelf_life as "shelfLife", origin, ingredients, remarks, weighing,
        is_off_shelf as "isOffShelf", sort_order as "sortOrder"
      FROM products
      WHERE id = ${req.id} AND client_id = ${auth.clientID}
    `;

    if (!product) {
      throw APIError.notFound("Product not found");
    }

    return product;
  }
);

// Creates a new product.
export const createProduct = api<CreateProductRequest, Product>(
  { auth: true, expose: true, method: "POST", path: "/pos/products" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    
    if (req.categoryId) {
      const existingProduct = await posDB.queryRow<{ id: number }>`
        SELECT id FROM products 
        WHERE LOWER(name) = LOWER(${req.name}) AND category_id = ${req.categoryId} AND client_id = ${auth.clientID}
      `;

      if (existingProduct) {
        throw APIError.alreadyExists("A product with this name already exists in the selected category");
      }
    }

    const product = await posDB.queryRow<Product>`
      INSERT INTO products (
        name, price, quantity, category_id, barcode, sku, second_name, wholesale_price,
        start_qty, stock_price, total_amount, shelf_life, origin, ingredients, remarks, weighing,
        is_off_shelf, sort_order, client_id
      )
      VALUES (
        ${req.name}, ${req.price}, ${req.quantity || 0}, ${req.categoryId},
        ${req.barcode}, ${req.sku}, ${req.secondName}, ${req.wholesalePrice},
        ${req.startQty || 0}, ${req.stockPrice}, ${req.totalAmount},
        ${req.shelfLife}, ${req.origin}, ${req.ingredients}, ${req.remarks}, ${req.weighing || false},
        FALSE, 0, ${auth.clientID}
      )
      RETURNING 
        id, name, price, quantity, category_id as "categoryId",
        barcode, sku, second_name as "secondName", wholesale_price as "wholesalePrice",
        start_qty as "startQty", stock_price as "stockPrice", total_amount as "totalAmount",
        shelf_life as "shelfLife", origin, ingredients, remarks, weighing,
        is_off_shelf as "isOffShelf", sort_order as "sortOrder"
    `;

    if (!product) {
      throw new Error("Failed to create product");
    }

    return product;
  }
);

// Updates an existing product.
export const updateProduct = api<UpdateProductRequest, Product>(
  { auth: true, expose: true, method: "PUT", path: "/pos/products/:id" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    
    if (req.name && req.categoryId) {
      const existingProduct = await posDB.queryRow<{ id: number }>`
        SELECT id FROM products 
        WHERE LOWER(name) = LOWER(${req.name}) AND category_id = ${req.categoryId} AND id != ${req.id} AND client_id = ${auth.clientID}
      `;

      if (existingProduct) {
        throw APIError.alreadyExists("A product with this name already exists in the selected category");
      }
    }

    const product = await posDB.queryRow<Product>`
      UPDATE products SET
        name = COALESCE(${req.name}, name),
        price = COALESCE(${req.price}, price),
        quantity = COALESCE(${req.quantity}, quantity),
        category_id = COALESCE(${req.categoryId}, category_id),
        barcode = COALESCE(${req.barcode}, barcode),
        sku = COALESCE(${req.sku}, sku),
        second_name = COALESCE(${req.secondName}, second_name),
        wholesale_price = COALESCE(${req.wholesalePrice}, wholesale_price),
        start_qty = COALESCE(${req.startQty}, start_qty),
        stock_price = COALESCE(${req.stockPrice}, stock_price),
        total_amount = COALESCE(${req.totalAmount}, total_amount),
        shelf_life = COALESCE(${req.shelfLife}, shelf_life),
        origin = COALESCE(${req.origin}, origin),
        ingredients = COALESCE(${req.ingredients}, ingredients),
        remarks = COALESCE(${req.remarks}, remarks),
        weighing = COALESCE(${req.weighing}, weighing)
      WHERE id = ${req.id} AND client_id = ${auth.clientID}
      RETURNING 
        id, name, price, quantity, category_id as "categoryId",
        barcode, sku, second_name as "secondName", wholesale_price as "wholesalePrice",
        start_qty as "startQty", stock_price as "stockPrice", total_amount as "totalAmount",
        shelf_life as "shelfLife", origin, ingredients, remarks, weighing,
        is_off_shelf as "isOffShelf", sort_order as "sortOrder"
    `;

    if (!product) {
      throw APIError.notFound("Product not found");
    }

    return product;
  }
);

// Deletes a product.
export const deleteProduct = api<{ id: number }, void>(
  { auth: true, expose: true, method: "DELETE", path: "/pos/products/:id" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    await posDB.exec`DELETE FROM products WHERE id = ${req.id} AND client_id = ${auth.clientID}`;
  }
);

// Moves product to first position in category (stick functionality).
export const stickProduct = api<{ id: number }, Product>(
  { auth: true, expose: true, method: "POST", path: "/pos/products/:id/stick" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    
    const product = await posDB.queryRow<{ id: number; category_id: number }>`
      SELECT id, category_id FROM products WHERE id = ${req.id} AND client_id = ${auth.clientID}
    `;

    if (!product) {
      throw APIError.notFound("Product not found");
    }

    // Get the highest sort_order in the same category
    const maxSortOrder = await posDB.queryRow<{ max_sort: number }>`
      SELECT COALESCE(MAX(sort_order), 0) as max_sort 
      FROM products 
      WHERE category_id = ${product.category_id} AND client_id = ${auth.clientID}
    `;

    const newSortOrder = (maxSortOrder?.max_sort || 0) + 1;

    // Update the product's sort_order to move it to the top
    const updatedProduct = await posDB.queryRow<Product>`
      UPDATE products SET sort_order = ${newSortOrder}
      WHERE id = ${req.id} AND client_id = ${auth.clientID}
      RETURNING 
        id, name, price, quantity, category_id as "categoryId",
        barcode, sku, second_name as "secondName", wholesale_price as "wholesalePrice",
        start_qty as "startQty", stock_price as "stockPrice", total_amount as "totalAmount",
        shelf_life as "shelfLife", origin, ingredients, remarks, weighing,
        is_off_shelf as "isOffShelf", sort_order as "sortOrder"
    `;

    if (!updatedProduct) {
      throw new Error("Failed to stick product");
    }

    return updatedProduct;
  }
);

// Toggles product off shelf status.
export const toggleOffShelf = api<{ id: number }, Product>(
  { auth: true, expose: true, method: "POST", path: "/pos/products/:id/toggle-off-shelf" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    const updatedProduct = await posDB.queryRow<Product>`
      UPDATE products SET is_off_shelf = NOT is_off_shelf
      WHERE id = ${req.id} AND client_id = ${auth.clientID}
      RETURNING 
        id, name, price, quantity, category_id as "categoryId",
        barcode, sku, second_name as "secondName", wholesale_price as "wholesalePrice",
        start_qty as "startQty", stock_price as "stockPrice", total_amount as "totalAmount",
        shelf_life as "shelfLife", origin, ingredients, remarks, weighing,
        is_off_shelf as "isOffShelf", sort_order as "sortOrder"
    `;

    if (!updatedProduct) {
      throw APIError.notFound("Product not found");
    }

    return updatedProduct;
  }
);
