import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Product } from "../backend.d";
import ProductCard from "../components/ProductCard";
import { useActor } from "../hooks/useActor";
import { CATEGORY_LABELS } from "../lib/bakery-utils";

const ALL_CAT = "all";
const SKELETON_KEYS = [
  "sk-1",
  "sk-2",
  "sk-3",
  "sk-4",
  "sk-5",
  "sk-6",
  "sk-7",
  "sk-8",
];

export default function ProductsPage() {
  const { actor } = useActor();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL_CAT);

  const { data: products = [], isLoading } = useQuery<Product[]>({
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

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === ALL_CAT || p.category === category;
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, category, search]);

  const categories: [string, string][] = Object.entries(CATEGORY_LABELS);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-6">All Products</h1>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="products.search_input"
        />
      </div>

      <Tabs value={category} onValueChange={setCategory} className="mb-8">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger
            value={ALL_CAT}
            className="rounded-full border"
            data-ocid="products.tab"
          >
            All
          </TabsTrigger>
          {categories.map(([key, label]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="rounded-full border"
              data-ocid={`products.${key}.tab`}
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {SKELETON_KEYS.map((k) => (
            <div
              key={k}
              className="aspect-[3/4] bg-accent/20 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-20 text-muted-foreground"
          data-ocid="products.empty_state"
        >
          <p className="text-lg">No products found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i + 1} />
          ))}
        </div>
      )}
    </main>
  );
}
