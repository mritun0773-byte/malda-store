import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBasket } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Product } from "../backend.d";
import CartSidebar from "../components/CartSidebar";
import ProductCard from "../components/ProductCard";
import { useGetProducts } from "../hooks/useQueries";

const FALLBACK_PRODUCTS: Product[] = [
  { id: 1n, active: true, name: "Water Bottle 1L", price: 20n },
  { id: 2n, active: true, name: "Water Bottle 500ml", price: 10n },
  { id: 3n, active: true, name: "Water Bottle 250ml", price: 5n },
  { id: 4n, active: true, name: "Eggs 12 pcs", price: 72n },
];

interface ShopPageProps {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

export default function ShopPage({ cartOpen, setCartOpen }: ShopPageProps) {
  const { data: products, isLoading } = useGetProducts();
  const displayProducts =
    products && products.length > 0 ? products : FALLBACK_PRODUCTS;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex gap-6">
        {/* Product Grid */}
        <section className="flex-1 min-w-0">
          <h2 className="text-lg font-bold mb-4 text-foreground">
            Featured Products
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 text-muted-foreground"
              data-ocid="product.empty_state"
            >
              <ShoppingBasket className="w-16 h-16 opacity-20 mb-3" />
              <p>No products available yet.</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07 } },
              }}
            >
              {displayProducts.map((product, idx) => (
                <motion.div
                  key={product.id.toString()}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.3 },
                    },
                  }}
                >
                  <ProductCard product={product} index={idx + 1} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Desktop Cart Sidebar */}
        <aside className="hidden md:block w-80 shrink-0">
          <div className="bg-card rounded-xl border border-border shadow-card sticky top-24">
            <CartSidebar />
          </div>
        </aside>
      </div>

      {/* Mobile Cart Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="right"
          className="p-0 w-80 max-w-full flex flex-col"
          data-ocid="cart.sheet"
        >
          <CartSidebar onClose={() => setCartOpen(false)} isSheet />
        </SheetContent>
      </Sheet>
    </main>
  );
}
