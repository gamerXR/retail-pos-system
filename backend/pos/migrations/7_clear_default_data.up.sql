-- Remove default categories for new licensed users
-- This migration will be applied when a new licensed user logs in
DELETE FROM categories WHERE name IN ('Essential Oils', 'Detailing', 'Buku', 'Sticker', 'No Type');
