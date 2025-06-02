// components/OrderStatusWatcher.tsx
"use client";

import { useCartStore } from "@/store/cart";
import { api } from "@/utils/api";
import { useEffect } from "react";


type OrderStatusWatcherProps = {
  orderId?: string;
};

export const OrderStatusWatcher = ({ orderId }: OrderStatusWatcherProps) => {
  const cartStore = useCartStore();
  const {
    mutate: checkOrderPaymentStatus,
    data: orderPaid,
    isPending,
    isSuccess,
  } = api.order.checkOrderPaymentStatus.useMutation({
    onSuccess: (orderPaid) => {
      if (orderPaid) {
        cartStore.clearCart();
        console.log("💰 Order is paid. Cart cleared.");
        // Tambahkan toast/alert jika ingin
      }
    },
  });

  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(() => {
      checkOrderPaymentStatus({ orderId });
    }, 3000); // setiap 3 detik cek status

    return () => clearInterval(interval); // bersihkan interval saat unmount
  }, [orderId]);

  return null; // atau bisa kasih indikator kalau lagi pending
};
