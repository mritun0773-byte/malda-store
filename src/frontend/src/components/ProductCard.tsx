import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star } from "lucide-react";
import type { Product } from "../backend.d";
import { useCart } from "../context/CartContext";
import { CATEGORY_EMOJI, CATEGORY_LABEL } from "../lib/categoryUtils";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 1 }: ProductCardProps) {
  const { addItem } = useCart();
  const price = (Number(product.priceCents) / 100).toFixed(2);
  const emoji = CATEGORY_EMOJI[product.category] ?? "🛒";

  return (
    <div
      data-ocid={`product.item.${index}`}
      className="bg-card rounded-xl border border-border shadow-card overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative bg-muted h-44 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {emoji}
          </div>
        )}
        <Badge className="absolute top-2 left-2 bg-navy text-white border-0 text-xs">
          {CATEGORY_LABEL[product.category]}
        </Badge>
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" />
          <span className="text-xs text-muted-foreground">
            {product.rating.toFixed(1)}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-foreground text-lg">₹{price}</span>
          <span className="text-xs text-muted-foreground">{product.unit}</span>
        </div>
        <div className="mt-auto pt-2">
          <Button
            data-ocid={`product.primary_button.${index}`}
            onClick={() => addItem(product)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
