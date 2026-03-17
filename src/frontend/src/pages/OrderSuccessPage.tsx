import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { CheckCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useActor } from "../hooks/useActor";

export default function OrderSuccessPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");
  const { actor } = useActor();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading",
  );

  const poll = useCallback(async () => {
    if (!actor || !sessionId) {
      setStatus("failed");
      return;
    }
    let attempts = 0;
    const check = async () => {
      try {
        const result = await actor.getStripeSessionStatus(sessionId);
        if (result.__kind__ === "completed") {
          clearCart();
          setStatus("success");
        } else if (result.__kind__ === "failed") {
          setStatus("failed");
        } else if (attempts < 6) {
          attempts++;
          setTimeout(check, 2000);
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    };
    await check();
  }, [actor, sessionId, clearCart]);

  useEffect(() => {
    poll();
  }, [poll]);

  return (
    <main className="container mx-auto px-4 py-20 max-w-md">
      <Card className="text-center">
        <CardContent className="pt-10 pb-8">
          {status === "loading" && (
            <div data-ocid="order-success.loading_state">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold">
                Confirming Payment...
              </h2>
              <p className="text-muted-foreground mt-2">
                Please wait a moment.
              </p>
            </div>
          )}
          {status === "success" && (
            <div data-ocid="order-success.success_state">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold">
                Order Confirmed!
              </h2>
              <p className="text-muted-foreground mt-2 mb-6">
                Thank you for your order. We will deliver your baking essentials
                soon!
              </p>
              <div className="flex flex-col gap-3">
                <Button asChild data-ocid="order-success.primary_button">
                  <Link to="/orders">View My Orders</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/products">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          )}
          {status === "failed" && (
            <div data-ocid="order-success.error_state">
              <p className="text-4xl mb-4">❌</p>
              <h2 className="font-display text-2xl font-bold">
                Payment Failed
              </h2>
              <p className="text-muted-foreground mt-2 mb-6">
                Something went wrong. Please try again.
              </p>
              <Button asChild data-ocid="order-success.primary_button">
                <Link to="/checkout">Try Again</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
