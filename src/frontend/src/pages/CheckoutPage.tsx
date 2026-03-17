import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { formatINR } from "../lib/bakery-utils";

const DELIVERY_AREAS = [
  "Kottur",
  "Saidapet",
  "Guindy",
  "Adyar",
  "Nandanam",
  "Ashok Nagar",
  "KK Nagar",
  "Velachery",
];

export default function CheckoutPage() {
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();
  const { items, totalPaise } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    street: "",
    city: "Chennai",
    pincode: "",
  });
  const [delivery, setDelivery] = useState<"standard" | "express">("standard");
  const [pincodeError, setPincodeError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <h2 className="font-display text-2xl font-bold mb-3">
          Login to Checkout
        </h2>
        <p className="text-muted-foreground mb-6">
          Please login with Internet Identity to place your order.
        </p>
        <Button onClick={login} data-ocid="checkout.primary_button">
          Login with Internet Identity
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <h2 className="font-display text-2xl font-bold mb-3">
          Your cart is empty
        </h2>
        <Button
          onClick={() => navigate({ to: "/products" })}
          data-ocid="checkout.primary_button"
        >
          Browse Products
        </Button>
      </div>
    );
  }

  const deliveryFee = delivery === "express" ? BigInt(5000) : BigInt(0);
  const grandTotal = totalPaise + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setPincodeError("");

    try {
      setLoading(true);
      const valid = await actor.isValidPincode(form.pincode);
      if (!valid) {
        setPincodeError(
          "Sorry, we only deliver within 8-10km of Kottur, Chennai. Valid pincodes include 600085, 600017, 600032, 600028, 600020, 600018, 600041.",
        );
        setLoading(false);
        return;
      }

      const shoppingItems = items.map((item) => ({
        productName: item.productName,
        currency: "INR",
        quantity: BigInt(item.quantity),
        priceInCents: item.pricePaise,
        productDescription: item.productName,
      }));

      const successUrl = `${window.location.origin}/order-success`;
      const cancelUrl = `${window.location.origin}/checkout`;

      const checkoutUrl = await actor.createCheckoutSession(
        shoppingItems,
        successUrl,
        cancelUrl,
      );
      window.location.href = checkoutUrl;
    } catch {
      toast.error("Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="font-display text-4xl font-bold mb-8">Checkout</h1>

      {/* Delivery Zone Info */}
      <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-3">
        <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm mb-1">
            Delivery Zone — JK Baking Essentials
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            We deliver within 8-10km of Kottur, Chennai. Serviceable areas:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DELIVERY_AREAS.map((area) => (
              <span
                key={area}
                className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    data-ocid="checkout.name.input"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    required
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+91 XXXXX XXXXX"
                    data-ocid="checkout.phone.input"
                  />
                </div>
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    required
                    value={form.street}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, street: e.target.value }))
                    }
                    data-ocid="checkout.street.input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      required
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      data-ocid="checkout.city.input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      required
                      value={form.pincode}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, pincode: e.target.value }));
                        setPincodeError("");
                      }}
                      placeholder="600085"
                      data-ocid="checkout.pincode.input"
                    />
                  </div>
                </div>
                {pincodeError && (
                  <Alert variant="destructive" data-ocid="checkout.error_state">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{pincodeError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Delivery Option</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={delivery}
                  onValueChange={(v) =>
                    setDelivery(v as "standard" | "express")
                  }
                  data-ocid="checkout.delivery.select"
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/20 cursor-pointer">
                    <RadioGroupItem
                      value="standard"
                      id="standard"
                      className="mt-1"
                    />
                    <Label htmlFor="standard" className="cursor-pointer flex-1">
                      <div className="font-medium">Standard Delivery</div>
                      <div className="text-sm text-muted-foreground">
                        1-2 business days &bull; Free
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/20 cursor-pointer">
                    <RadioGroupItem
                      value="express"
                      id="express"
                      className="mt-1"
                    />
                    <Label htmlFor="express" className="cursor-pointer flex-1">
                      <div className="font-medium">Express Delivery</div>
                      <div className="text-sm text-muted-foreground">
                        Same day (order before 12 PM) &bull; &#x20B9;50
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.productId}
                    className="flex justify-between text-sm"
                    data-ocid={`checkout.item.${idx + 1}`}
                  >
                    <span>
                      {item.productName} &times; {item.quantity}
                    </span>
                    <span>
                      {formatINR(item.pricePaise * BigInt(item.quantity))}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatINR(totalPaise)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span>
                    {delivery === "express" ? formatINR(BigInt(5000)) : "Free"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-primary">{formatINR(grandTotal)}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-4"
                  disabled={loading}
                  data-ocid="checkout.submit_button"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {loading ? "Processing..." : "Pay with Card"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure payment powered by Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </main>
  );
}
