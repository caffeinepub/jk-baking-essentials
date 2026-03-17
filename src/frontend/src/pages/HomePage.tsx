import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Truck } from "lucide-react";
import type { Product } from "../backend.d";
import ProductCard from "../components/ProductCard";
import { useActor } from "../hooks/useActor";

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4"];

export default function HomePage() {
  const { actor } = useActor();

  const { data: products } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const list = await actor!.getProducts();
      if (list.length === 0) {
        await actor!.seedProducts();
        return actor!.getProducts();
      }
      return list;
    },
    enabled: !!actor,
  });

  const featured = products?.slice(0, 4) || [];

  return (
    <main>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-accent/20 to-background py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <p className="text-primary font-medium text-sm uppercase tracking-widest mb-3">
            Kottur, Chennai
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground leading-tight mb-4">
            Baking Essentials,
            <br />
            <span className="text-primary">Delivered to Your Door</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Premium quality baking ingredients and tools, delivered within
            8-10km of Kottur.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild data-ocid="hero.primary_button">
              <Link to="/products">Shop Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4 bg-card">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4 p-6 rounded-xl bg-accent/20">
            <MapPin className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Local Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Delivering within 8-10km of Kottur, Chennai. Areas include
                Saidapet, Guindy, Adyar &amp; more.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 rounded-xl bg-accent/20">
            <Clock className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Same Day Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Order before 12 PM for same-day express delivery. Standard
                delivery in 1-2 days.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 rounded-xl bg-accent/20">
            <Truck className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Free Standard Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Free standard delivery on all orders. Express delivery available
                for &#x20B9;50 extra.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold">
              Featured Products
            </h2>
            <Button variant="outline" asChild data-ocid="home.products.link">
              <Link to="/products">View All</Link>
            </Button>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featured.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i + 1} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SKELETON_KEYS.map((k) => (
                <div
                  key={k}
                  className="aspect-square bg-accent/20 rounded-xl animate-pulse"
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
