import { Button } from "../ui/button";

import { PRODUCTS } from "@/data/mock";
import { toRupiah } from "@/utils/toRupiah";
import { CheckCircle2, Minus, Plus, RefreshCcw } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "../ui/alert-dialog";
import { Separator } from "../ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { PaymentQRCode } from "./PaymentQrCode";
import { useCartStore } from "@/store/cart";
import { api } from "@/utils/api";
import { OrderStatusWatcher } from "./OrderStatusWatcher";
import { toast } from "sonner";

type OrderItemProps = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  handleIncrementCartItem: (productId: string) => void;
  handleDecrementCartItem: (productId: string) => void;
};

const OrderItem = ({ id, name, price, imageUrl, quantity, handleIncrementCartItem, handleDecrementCartItem }: OrderItemProps) => {
  return (
    <div className="flex gap-3" key={id}>
      <div className="relative aspect-square h-20 shrink-0 overflow-hidden rounded-xl">
        <Image
          src={imageUrl}
          alt={name}
          fill
          unoptimized
          className="object-cover"
        />
      </div>

      <div className="flex w-full flex-col justify-between">
        <div className="flex flex-col">
          <p>{name}</p>
          <p className="text-muted-foreground text-sm">
            {toRupiah(price)} x {quantity}
          </p>
        </div>

        <div className="flex w-full justify-between">
          <p className="font-medium">{toRupiah(quantity * price)}</p>

          <div className="flex items-center gap-3">
            <button onClick={()=>handleDecrementCartItem(id)}  className="bg-secondary hover:bg-secondary/80 cursor-pointer rounded-full p-1">
              <Minus className="h-4 w-4" />
            </button>

            <span className="text-sm">{quantity>0 ? quantity : 0}</span>

            <button onClick={()=>handleIncrementCartItem(id)} className="bg-secondary hover:bg-secondary/80 cursor-pointer rounded-full p-1">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

type CreateOrderSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CreateOrderSheet = ({
  open,
  onOpenChange,
}: CreateOrderSheetProps) => {
  const cartStore = useCartStore();

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInfoLoading, setPaymentInfoLoading] = useState(false);

  // const subtotal = 1000;
  const subtotal = cartStore.items.reduce((a, b) => {
    return a + b.price * b.quantity;
  }, 0);
  const tax = useMemo(() => subtotal * 0.1, [subtotal]);
  const grandTotal = useMemo(() => subtotal + tax, [subtotal, tax]);

  const { mutate: createOrder, data: createOrderResponse } =
    api.order.createOrder.useMutation({
      onSuccess: () => {
        toast("Create Order");

        setPaymentDialogOpen(true);
      },
    });

  const { mutateAsync: simulatePayment } = api.order.simulatePayment.useMutation({
    onSuccess: () => {
      toast("Simulate Payment");
    },
  });

  const {
    mutate: checkOrderPaymentStatus,
    data: orderPaid,
    isPending: checkOrderPaymentStatusIsPending,
    reset: resetCheckOrderPaymentStatus,
    isSuccess: checkOrderPaymentStatusIsSuccess
  } = api.order.checkOrderPaymentStatus.useMutation({
    onSuccess: (orderPaid) => {
      console.log("Success orderrpaid status:", orderPaid);
      console.log("Success status:", orderPaid);
      if(orderPaid) {
        cartStore.clearCart();
        return
      }
    }
  });

    const {data: products} = api.product.getProducts.useQuery()
  
    const handleAddToCart = (productId: string) => {
      const productToAdd = products?.find(product => product.id === productId)
      
      if(!productToAdd) {
        toast("Product not found")
        return
      }
      cartStore.addToCart({
        productId: productId,
        productName: productToAdd.productName,
        price: productToAdd.price,
        imageUrl: productToAdd.imageUrl ?? ""
      })
    };

    const handleDecrementCartItem = (productId: string) => {
      cartStore.decrementCartItem(productId)
    }
  
  const handleCreateOrder = () => {
    createOrder({
      orderItems: cartStore.items.map((item) => {
        return {
          productId: item.productId,
          quantity: item.quantity,
        };
      }),
    });
    // setPaymentDialogOpen(true);
    // setPaymentInfoLoading(true);

    // setTimeout(() => {
    //   setPaymentInfoLoading(false);
    // }, 3000);
  };

  const handleRefresh = async() => {
    if (!createOrderResponse) return;
    checkOrderPaymentStatus({
      orderId: createOrderResponse?.order.id,
    });
  };
  
 const handleSimulatePayment =  async () => {
  if (!createOrderResponse) return;

  await simulatePayment({
    orderId: createOrderResponse.order.id,
  });
  // resetCheckOrderPaymentStatus();
  
  checkOrderPaymentStatus({
    orderId: createOrderResponse?.order.id,
  });
  // Baru cek status setelah simulasi pembayaran selesai
  //  handleRefresh();
  cartStore.clearCart();
};

  const handleClosePaymentDialog = async () => {
    onOpenChange(false);
    setPaymentDialogOpen(false);
    await handleRefresh();
    resetCheckOrderPaymentStatus();
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full">
          <SheetHeader>
            <SheetTitle className="text-2xl">Create New Order</SheetTitle>
            <SheetDescription>
              Add products to your cart and create a new order.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 overflow-y-scroll p-4">
            <h1 className="text-xl font-medium">Order Items</h1>
            <div className="flex flex-col gap-6">
              {/* Map order items here */}
              {cartStore.items.map((item) => {
                return (
                  <OrderItem
                    key={item.productId}
                    id={item.productId}
                    name={item.productName}
                    imageUrl={item.imageUrl}
                    price={item.price}
                    quantity={item.quantity}
                    handleIncrementCartItem={handleAddToCart}
                    handleDecrementCartItem={handleDecrementCartItem}
                  />
                );
              })}
            </div>
          </div>

          <SheetFooter>
            <h3 className="text-lg font-medium">Payment Details</h3>

            <div className="grid grid-cols-2 gap-2">
              <p>Subtotal</p>
              <p className="place-self-end">{toRupiah(subtotal)}</p>

              <p>Tax</p>
              <p className="place-self-end">{toRupiah(tax)}</p>

              <Separator className="col-span-2" />

              <p>Total</p>

              <p className="place-self-end">{toRupiah(grandTotal)}</p>
            </div>

            <Button
              size="lg"
              className="mt-8 w-full"
              onClick={handleCreateOrder}
            >
              Create Order
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent>
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-lg font-medium">Finish Payment</p>
            {/* <OrderStatusWatcher orderId={createOrderResponse?.order.id} /> */}

            {paymentInfoLoading ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="border-primary h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-l-2" />

                <p>Loading...</p>
              </div>
            ) : (
              <>
                <Button variant="link" onClick={handleRefresh} disabled={checkOrderPaymentStatusIsPending}>
                  {checkOrderPaymentStatusIsPending ? "Refreshing...": "Refresh"}
                </Button>
                {!orderPaid && !checkOrderPaymentStatusIsSuccess  ? (
                  <PaymentQRCode
                    qrString={createOrderResponse?.qrString ?? ""}
                  />
                ) : (
                  <CheckCircle2 className="size-80 text-green-500" />
                )}

                <p className="text-3xl font-medium">
                  {toRupiah(createOrderResponse?.order.grandTotal ?? 0)}
                </p>

                <p className="text-muted-foreground text-sm">
                  Transaction ID: {createOrderResponse?.order.id}
                </p>
                {!orderPaid && !checkOrderPaymentStatusIsSuccess &&(
                <Button
                  variant={"default"}
                  onClick={handleSimulatePayment}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Simulate Payment
                </Button>

                )}
              </>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                disabled={!orderPaid && !checkOrderPaymentStatusIsSuccess}
                variant="outline"
                className="w-full"
                onClick={handleClosePaymentDialog}
              >
                Done
              </Button>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
