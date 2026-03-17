import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatINR } from "../lib/bakery-utils";

export default function CartDrawer() {
  const { items, removeItem, updateQty, totalPaise, setIsOpen } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground"
        data-ocid="cart.empty_state"
      >
        <span className="text-4xl">🧁</span>
        <p className="text-sm">Your cart is empty</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            navigate({ to: "/products" });
          }}
        >
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {items.map((item, idx) => (
          <div
            key={item.productId}
            className="flex items-center gap-3"
            data-ocid={`cart.item.${idx + 1}`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.productName}</p>
              <p className="text-xs text-muted-foreground">
                {formatINR(item.pricePaise)} each
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => updateQty(item.productId, item.quantity - 1)}
                data-ocid={`cart.item.${idx + 1}.secondary_button`}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center text-sm">{item.quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => updateQty(item.productId, item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => removeItem(item.productId)}
                data-ocid={`cart.item.${idx + 1}.delete_button`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-3">
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-primary">{formatINR(totalPaise)}</span>
        </div>
        <Button
          className="w-full"
          onClick={() => {
            setIsOpen(false);
            navigate({ to: "/checkout" });
          }}
          data-ocid="cart.primary_button"
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
