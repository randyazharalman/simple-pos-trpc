import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { supabaseAdmin } from "@/server/supabase-admin";
import { Bucket } from "@/server/bucket";
import { TRPCError } from "@trpc/server";

export const productRouter = createTRPCRouter({
  getProducts: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const products = await db.product.findMany({
      select: {
        id: true,
        productName: true,
        price: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        imageUrl: true,
      },
    });
    return products;
  }),

  createProduct: protectedProcedure
    .input(
      z.object({
        productName: z.string().min(3),
        imageUrl: z.string().url(),
        price: z.coerce.number().min(1000),
        categoryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const newProduct = await db.product.create({
        data: {
          productName: input.productName,
          price: input.price,
          imageUrl: input.imageUrl,
          categoryId: input.categoryId,
        },
        select: {
          id: true,
          productName: true,
          price: true,
          imageUrl: true,
          category: true,
        },
      });
      return newProduct;
    }),

  crateProductImageUploadSignedUrl: protectedProcedure.mutation(
    async () => {
      const { data, error } = await supabaseAdmin.storage
        .from(Bucket.ProductImages)
        .createSignedUploadUrl(`${Date.now()}.jpeg`);

        if(error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message
          })
        }

        return data;
    },
  ),
  deleteProductById: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const deleteProduct = await db.product.delete({
        where: {
          id: input.productId,
        },
      });
      return deleteProduct;
    }),
});
