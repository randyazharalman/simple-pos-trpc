import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { supabaseAdmin } from "@/server/supabase-admin";
import { Bucket } from "@/server/bucket";
import { TRPCError } from "@trpc/server";
import { toast } from "sonner";
import type { Prisma } from "@prisma/client";

export const productRouter = createTRPCRouter({
  getProducts: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
        productQuery: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { categoryId, productQuery } = input;

      // const filter: Prisma.ProductWhereInput =
      //   categoryId === "all" && productQuery === ""
      //     ? {}
      //     : { categoryId, productName: productQuery };
        const filter: Prisma.ProductWhereInput = {
    ...(categoryId !== "all" && categoryId ? { categoryId } : {}),
    ...(productQuery ? {
      productName: {
        contains: productQuery,
        mode: "insensitive", // for case-insensitive search
      }
    } : {}),
  };
      const products = await db.product.findMany({
        where: filter,
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

  crateProductImageUploadSignedUrl: protectedProcedure.mutation(async () => {
    const { data, error } = await supabaseAdmin.storage
      .from(Bucket.ProductImages)
      .createSignedUploadUrl(`${Date.now()}.jpeg`);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return data;
  }),
  updateProduct: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        productName: z.string().min(3),
        imageUrl: z.string().url(),
        price: z.coerce.number().min(1000),
        categoryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      // 1. Ambil produk lama termasuk imageUrl
      const existingProduct = await db.product.findUnique({
        where: { id: input.productId },
        select: {
          imageUrl: true,
        },
      });

      if (!existingProduct) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produk tidak ditemukan",
        });
      }

      // 2. Cek apakah image-nya diganti
      const isImageChanged =
        input.imageUrl && input.imageUrl !== existingProduct.imageUrl;

      if (isImageChanged && existingProduct.imageUrl) {
        const oldPath = existingProduct.imageUrl.split(
          "/storage/v1/object/public/",
        )[1];

        if (oldPath) {
          const { error } = await supabaseAdmin.storage
            .from(Bucket.ProductImages)
            .remove([oldPath]);

          if (error) {
            console.error(
              "Gagal hapus gambar lama dari Supabase:",
              error.message,
            );
          }
        }
      }

      // 3. Update produk
      const updatedProduct = await db.product.update({
        where: { id: input.productId },
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

      return updatedProduct;
    }),
  deleteProductById: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const product = await db.product.findUnique({
        where: {
          id: input.productId,
        },
        select: {
          id: true,
          imageUrl: true,
        },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produk tidak ditemukan",
        });
      }

      console.log(product.imageUrl);

      const deleteProduct = await db.product.delete({
        where: {
          id: input.productId,
        },
      });
      if (product.imageUrl) {
        const path = product.imageUrl.split("/storage/v1/object/public/")[1];

        if (path) {
          const { error } = await supabaseAdmin.storage
            .from(Bucket.ProductImages)
            .remove([path]);

          if (error) {
            toast("Gagal hapus gambar dari Supabase:" + error.message);
          }
        }
      }

      return deleteProduct;
    }),
});
