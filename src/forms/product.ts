import { z } from 'zod'

export const productFormSchema = z.object({
  productName: z.string().min(3).max(30),
  price: z.coerce.number({ message: "Price is required" }).min(1000),
  categoryId: z.string({ message: "Category is required" }),

})

export type ProductFormSchema = z.infer<typeof productFormSchema>;