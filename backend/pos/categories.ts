import { api } from "encore.dev/api";
import { posDB } from "./db";

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
}

export interface CategoriesResponse {
  categories: Category[];
}

// Gets all categories.
export const getCategories = api<void, CategoriesResponse>(
  { expose: true, method: "GET", path: "/pos/categories" },
  async () => {
    const categories = await posDB.queryAll<Category>`
      SELECT id, name, color
      FROM categories
      ORDER BY name
    `;

    return { categories };
  }
);

// Gets all categories in flat structure (for dropdowns).
export const getFlatCategories = api<void, CategoriesResponse>(
  { expose: true, method: "GET", path: "/pos/categories/flat" },
  async () => {
    const categories = await posDB.queryAll<Category>`
      SELECT id, name, color
      FROM categories
      ORDER BY name
    `;

    return { categories };
  }
);

// Creates a new category.
export const createCategory = api<CreateCategoryRequest, Category>(
  { expose: true, method: "POST", path: "/pos/categories" },
  async (req) => {
    const category = await posDB.queryRow<Category>`
      INSERT INTO categories (name, color)
      VALUES (${req.name}, ${req.color || '#6B7280'})
      RETURNING id, name, color
    `;

    if (!category) {
      throw new Error("Failed to create category");
    }

    return category;
  }
);

// Updates a category.
export const updateCategory = api<{ id: number; name?: string; color?: string }, Category>(
  { expose: true, method: "PUT", path: "/pos/categories/:id" },
  async (req) => {
    const category = await posDB.queryRow<Category>`
      UPDATE categories SET
        name = COALESCE(${req.name}, name),
        color = COALESCE(${req.color}, color)
      WHERE id = ${req.id}
      RETURNING id, name, color
    `;

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  }
);

// Deletes a category.
export const deleteCategory = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/pos/categories/:id" },
  async (req) => {
    // First, check if there are any products in this category
    const productsCount = await posDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM products WHERE category_id = ${req.id}
    `;

    if (productsCount && productsCount.count > 0) {
      throw new Error("Cannot delete category that contains products. Please move or delete products first.");
    }

    // Delete the category
    await posDB.exec`DELETE FROM categories WHERE id = ${req.id}`;
  }
);
