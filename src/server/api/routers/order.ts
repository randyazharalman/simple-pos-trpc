import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createQRIS, xenditPaymentMethodClient } from "@/server/xendit";
import { TRPCError } from "@trpc/server";
import { OrderStatus, Prisma } from "@prisma/client";

export const orderRouter = createTRPCRouter({
  createOrder: protectedProcedure
  .input(
    z.object({
      orderItems: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1)
      }))
    })
  )
  .mutation(async ({ctx, input}) => {
    const { db } = ctx;
    const { orderItems } = input;

    const products = await db.product.findMany({
      where: {
        id: {
          in: orderItems.map(item => item.productId)
        }
      },
    });

    let subtotal = 0;

    products.forEach(product => {
      const productQuantity = orderItems.find(item => item.productId === product.id)!.quantity 

      const price = product.price * productQuantity

      subtotal += price
    })

    const tax = subtotal * 0.1;

    const grandTotal = subtotal + tax;
    
    const order = await db.order.create({
      data: {
        grandTotal: grandTotal,
        subtotal:subtotal,
        tax: tax
      }
    });

    const newOrderItems = await db.orderItem.createMany({
      data: products.map(product => {
        const productQuantity = orderItems.find(item => item.productId === product.id)!.quantity
        
        const totalPrice = product.price * productQuantity;

        return {
          orderId: order.id,
          price: product.price,
          productId: product.id,
          quantity: productQuantity
        }
      })
    })

    const paymentRequest = await createQRIS({
      amount: grandTotal,
      orderId: order.id,
    })

    await db.order.update({
      where: {
        id: order.id
      },
      data : {
        externalTransactionId: paymentRequest.id,
        paymentMethodId: paymentRequest.paymentMethod.id
      }
    })
    return {
      order,
      newOrderItems,
      qrString: paymentRequest.paymentMethod.qrCode!.channelProperties!.qrString!,
    }
  }),

  simulatePayment: protectedProcedure
  .input(
    z.object({
      orderId: z.string().uuid(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { db } = ctx;

    const order = await db.order.findUnique({
      where: {
        id: input.orderId,
      },
      select: {
        paymentMethodId: true,
        grandTotal: true,
        externalTransactionId: true,
      }
    })

    if(!order) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Order not found"
      })
    }

    await xenditPaymentMethodClient.simulatePayment({
      paymentMethodId: order.paymentMethodId!,
      data : {
        amount: order.grandTotal
      }
    })
  }),

  checkOrderPaymentStatus: protectedProcedure
  .input(
    z.object({
      orderId: z.string().uuid(),
    })
  )
  .mutation(async ({ctx, input}) => {
    const {db} = ctx;

    const order = await db.order.findUnique({
      where: {
        id: input.orderId,
      },
      select: {
        paidAt: true,
        status: true,
      }
    })

    if(!order?.paidAt){
      return false
    }

    return true
  }),

  getOrders: protectedProcedure
  .input(
    z.object({
      status: z.enum(["ALL", ...Object.keys(OrderStatus)]).default("ALL"),
    })
  )
  .query(async ( {ctx, input} ) => {
    const { db } = ctx;
    const { status } = input;

    // filter status logic below
    const filterStatus: Prisma.OrderWhereInput =
    status === "ALL" ? {} : { status: status as OrderStatus };

    const orders = await db.order.findMany({
      where: filterStatus,
      select: {
        id: true,
        grandTotal: true,
        status: true,
        paidAt: true,
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    })

    return orders
  }),

  finishOrder: protectedProcedure
  .input(
    z.object({
      orderId: z.string().uuid(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { db } = ctx;
    const { orderId } = input;

    const order = await db.order.findUnique({
      where :{
        id: orderId,
      },
      select : {
        id: true,
        paidAt: true,
        status: true,
      }
    })

    if(!order) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Order not found"
      })
    }

    if(!order.paidAt) {
      throw new TRPCError({
        code: "UNPROCESSABLE_CONTENT",
        message: "Order is not paid yet"
      })
    }
    if(order.status !== OrderStatus.PROCESSING) {
      throw new TRPCError({
        code: "UNPROCESSABLE_CONTENT",
        message: "Order is not processing yet"
      })
    }

    await db.order.update({
      where : {
        id: order.id,
      },
      data: {
        status: OrderStatus.DONE
      }
    })

  }),

  getSalesReport: protectedProcedure
  .query(async ({ ctx }) => {
    const { db } = ctx;

    const paidOrdersQuery =  db.order.findMany({
      where: {
        paidAt: {
          not: null,
        }
      },
      select: {
        grandTotal: true,
      }
    })
    
    const ongoingOrdersQuery =  db.order.findMany({
      where: {
        status: {
          not: OrderStatus.DONE,
        }
      },
      select : {
        id: true,
      }
    })

    
    
    const completedOrdersQuery =  db.order.findMany({
      where: {
        status: OrderStatus.DONE,
      },
      select : {
        id: true,
      }
    })
    
    const [paidOrders, ongoingOrders, completedOrders] = await Promise.all([
      paidOrdersQuery,
      ongoingOrdersQuery,
      completedOrdersQuery,
    ])
    
    const totalRevenue = paidOrders.reduce((a, b) => {
        return a + b.grandTotal
    },0)
    
    const totalOngoingOrders = ongoingOrders.length
    
    const totalCompletedOrders = completedOrders.length;
    return {
      totalRevenue,
      totalOngoingOrders,
      totalCompletedOrders,
    }
  })
})