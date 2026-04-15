import { z } from "zod"

const CreateProductSchema = z.object({
  id: z.string().uuid().optional(), // For wholesalers linking to existing products
  producerId: z.string().uuid().optional(), // For wholesalers creating new products
  productName: z
    .string()
    .min(2, 'Product name must be at least 2 characters')
    .max(255, 'Product name is too long'),
  description: z.string().max(1000).optional().nullable(),
  category: z
    .enum([
      'Beverages',
      'Grains & Cereals',
      'Dairy',
      'Toiletries & Personal Care',
      'Cleaning Products',
      'Snacks & Confectionery',
      'Cooking Oils & Fats',
      'Fresh Produce',
      'Meat & Poultry',
      'Other',
    ])
    .optional()
    .nullable(),
  unitOfMeasure: z
    .enum(['unit', 'kg', 'g', 'litre', 'ml', 'box', 'crate', 'bag', 'dozen'])
    .default('unit'),
  price: z
    .number()
    .positive('Price must be greater than 0')
    .max(9999999999.99, 'Price is too large'),
  currentStockLevel: z
    .number()
    .min(0, 'Stock level cannot be negative')
    .default(0),
  reorderPoint: z
    .number()
    .min(0, 'Reorder point cannot be negative')
    .default(0),
  isActive: z.boolean().default(true),
})

const prodSchema = {
    CreateProductSchema
}

export default prodSchema