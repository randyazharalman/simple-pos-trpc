import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import { OrderCard, type Order } from "@/components/OrderCard";
import type { NextPageWithLayout } from "../_app";
import type { ReactElement } from "react";
import { useState } from "react";
import { api } from "@/utils/api";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatus } from "@prisma/client";
import { toRupiah } from "@/utils/toRupiah";

const SalesPage: NextPageWithLayout = () => {
  const apiUtils = api.useUtils();
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "ALL">("ALL");
  const { data: orders } = api.order.getOrders.useQuery({
    status: filterStatus,
  });

  const {
    mutate: onFinishOrder,
    isPending: finishOrderIsPending,
    variables: onFinishOrderVariabel,
  } = api.order.finishOrder.useMutation({
    onSuccess: async () => {
      await apiUtils.order.invalidate();
    },
  });

  const { data: salesReport } = api.order.getSalesReport.useQuery();

  const handleFilterStatusChange = (value: OrderStatus | "ALL") => {
    setFilterStatus(value);
  };

  const handleFinishOrder = (orderId: string) => {
    onFinishOrder({
      orderId,
    });
  };

  return (
    <>
      <DashboardHeader>
        <DashboardTitle>Sales Dashboard</DashboardTitle>
        <DashboardDescription>
          Track your sales performance and view analytics.
        </DashboardDescription>
      </DashboardHeader>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-medium">Total Revenue</h3>
          <p className="mt-2 text-3xl font-bold">
            {toRupiah(salesReport?.totalRevenue ?? 0)}
          </p>
        </div>

        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-medium">Ongoing Orders</h3>
          <p className="mt-2 text-3xl font-bold">
            {salesReport?.totalOngoingOrders}
          </p>
        </div>

        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-medium">Completed Orders</h3>
          <p className="mt-2 text-3xl font-bold">
            {salesReport?.totalCompletedOrders}
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <div className="flex justify-between">
          <h3 className="mb-4 text-lg font-medium">Orders</h3>
          <Select defaultValue="ALL" onValueChange={handleFilterStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent align={"end"}>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="ALL">ALL</SelectItem>
                {Object.keys(OrderStatus).map((orderStatus) => {
                  const key = orderStatus as keyof typeof OrderStatus;
                  return (
                    <SelectItem key={orderStatus} value={orderStatus}>
                      {OrderStatus[key].replace(/_/g, " ")}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders?.map((order) => (
            <OrderCard
              key={order.id}
              id={order.id}
              grandTotal={order.grandTotal}
              orderItems={order._count.orderItems}
              status={order.status}
              isFinishingOrder={
                finishOrderIsPending &&
                order.id === onFinishOrderVariabel.orderId
              }
              onFinishOrder={handleFinishOrder}
            />
          ))}
        </div>
      </div>
    </>
  );
};

SalesPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default SalesPage;
