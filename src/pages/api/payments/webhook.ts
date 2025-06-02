import { db } from "@/server/db";
import { OrderStatus } from "@prisma/client";
import type { NextApiHandler } from "next";

type XenditWebhookBody = {
    "event": "payment.succeeded",
    "data": {
        "id": "pymt-2e9badf8-1473-4e8a-a1cf-d1e3214afc0f",
        "amount": 15000,
        "country": "ID",
        "currency": "IDR",
        "payment_request_id": "pr-df560c7d-b059-4789-ad2f-3cee5d8230a8",
        "reference_id": "a5151a05-e84d-4cef-bb17-1ref3e7fb3a",
        "status": "SUCCEEDED" | "FAILED",
    }
}
const handler: NextApiHandler = async (req, res) => {
  if(req.method !== "POST") return;


  // verify webhook only from xendit
  const headers = req.headers;
  const webhookToken = headers["x-callback-token"];

  if(webhookToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
    res.status(401)
  }

  //get body from request
  const body = req.body as XenditWebhookBody


  // 1. find order
  // 2. if success, update order status to success
  const order = await db.order.findUnique({
    where: {
      id: body.data.reference_id
    }
  });

  if(!order) {
    return res.status(404).send("Order not found")
  }

  if(body.data.status !== "SUCCEEDED"){
    // update order to failed
    return res.status(422)
  }

  await db.order.update({
    where: {
      id: order.id,
    },
    data: {
      paidAt: new Date(),
      status: OrderStatus.PROCESSING
    }
  })

  res.status(200)
}

export default handler;