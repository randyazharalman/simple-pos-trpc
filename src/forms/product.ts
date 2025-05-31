import { z } from 'zod'

export const productFormSchema = z.object({
  productName: z.string().min(3).max(30),
  price: z.coerce.number({ message: "Price is required" }).min(1000),
  imageUrl: z.string().url(),
  categoryId: z.string({ message: "Category is required" }),

})
export const updateProductSchema = z.object({
  id: z.string(),
  productName: z.string().min(3).max(30),
  price: z.coerce.number({ message: "Price is required" }).min(1000),
  imageUrl: z.string().url(),
  categoryId: z.string({ message: "Category is required" }),

})

export type ProductFormSchema = z.infer<typeof productFormSchema>;
export const updateProductFormSchema = updateProductSchema.omit({ id: true })
export type UpdateProductFormSchema = Omit<z.infer<typeof updateProductSchema>, "id">;
export type UpdateProductSchema = z.infer<typeof updateProductSchema>
