import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import type { Product } from "../backend.d";
import { useCart } from "../context/CartContext";
import { CATEGORY_LABELS, formatINR } from "../lib/bakery-utils";

interface Props {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: Props) {
  const { addItem } = useCart();

  const inStock = Number(product.stockQuantity) > 0;

  return (
    <Card
      className="overflow-hidden hover:shadow-warm transition-shadow"
      data-ocid={`product.item.${index}`}
    >
      <div className="aspect-square bg-accent/30 flex items-center justify-center text-5xl">
        {getCategoryEmoji(product.category)}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm leading-tight">
            {product.name}
          </h3>
          {!inStock && (
            <Badge variant="destructive" className="text-xs shrink-0">
              Out of Stock
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {product.description}
        </p>
        <Badge variant="secondary" className="text-xs">
          {CATEGORY_LABELS[product.category] || product.category}
        </Badge>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="font-bold text-primary text-lg">
          {formatINR(product.pricePaise)}
        </span>
        <Button
          size="sm"
          disabled={!inStock}
          onClick={() =>
            addItem({
              productId: product.id,
              productName: product.name,
              pricePaise: product.pricePaise,
            })
          }
          data-ocid={`product.item.${index}.primary_button`}
        >
          <ShoppingCart className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </CardFooter>
    </Card>
  );
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    floursGrains: "🌾",
    sweeteners: "🍯",
    fatsOils: "🧈",
    leaveningAgents: "✨",
    flavorExtracts: "🌸",
    cakeMixes: "🍰",
    decoratingTools: "🎨",
    bakingEquipment: "🪙",
  };
  return map[cat] || "🧥";
}
