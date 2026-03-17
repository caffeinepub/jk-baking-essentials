import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { Order } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  formatINR,
} from "../lib/bakery-utils";

export default function MyOrdersPage() {
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["userOrders"],
    queryFn: () => actor!.getUserOrders(),
    enabled: !!actor && !!identity,
  });

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <h2 className="font-display text-2xl font-bold mb-3">
          Login to View Orders
        </h2>
        <Button onClick={login} data-ocid="orders.primary_button">
          Login
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="container mx-auto px-4 py-20 text-center"
        data-ocid="orders.loading_state"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="font-display text-4xl font-bold mb-8">My Orders</h1>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20" data-ocid="orders.empty_state">
          <p className="text-muted-foreground mb-4">
            You haven&apos;t placed any orders yet.
          </p>
          <Button asChild>
            <Link to="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, idx) => (
            <Card key={order.id} data-ocid={`orders.item.${idx + 1}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        Number(order.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={ORDER_STATUS_COLORS[order.status]}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 mb-3">
                  {order.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {item.name} &times; {item.quantity.toString()}
                      </span>
                      <span>{formatINR(item.pricePaise * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    Delivery:{" "}
                    {order.deliveryOption === "express"
                      ? "Express"
                      : "Standard"}
                  </span>
                  <span className="font-bold text-primary">
                    {formatINR(order.totalAmountPaise)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
