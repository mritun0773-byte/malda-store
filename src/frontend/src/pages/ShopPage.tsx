import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { GroceryCategory } from "../backend.d";
import { CartPanel } from "../components/CartPanel";
import { ProductCard } from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { useProducts } from "../hooks/useQueries";
import {
  ALL_CATEGORIES,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  SAMPLE_PRODUCTS,
} from "../lib/categoryUtils";

export default function ShopPage() {
  const searchParams = useSearch({ from: "/shop" });
  const [searchQuery, setSearchQuery] = useState(
    (searchParams as { q?: string }).q ?? "",
  );
  const [activeCategory, setActiveCategory] = useState<GroceryCategory | "all">(
    ((searchParams as { category?: string }).category as GroceryCategory) ??
      "all",
  );
  const { isOpen } = useCart();

  const { data: products, isLoading } = useProducts();
  const allProducts =
    products && products.length > 0 ? products : SAMPLE_PRODUCTS;

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      const matchCat =
        activeCategory === "all" || p.category === activeCategory;
      const matchQ =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQ;
    });
  }, [allProducts, activeCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Shop All Products
        </h1>
        <p className="text-muted-foreground mt-1">
          {filtered.length} products available
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-ocid="shop.search_input"
            placeholder="Search groceries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
        <Button
          data-ocid="shop.primary_button"
          variant="outline"
          className="rounded-full gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        <button
          type="button"
          data-ocid="shop.all.tab"
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
            activeCategory === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          All
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat}
            data-ocid={`shop.${cat}.tab`}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border gap-1.5 flex items-center ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            <span>{CATEGORY_EMOJI[cat]}</span>
            {CATEGORY_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* Products + Cart */}
      <div className="flex items-start gap-6">
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((id) => (
                <div
                  key={id}
                  className="rounded-xl border border-border overflow-hidden"
                >
                  <Skeleton className="h-40 w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              data-ocid="shop.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <span className="text-5xl block mb-4">🔍</span>
              <p className="font-semibold text-lg">No products found</p>
              <p className="text-sm mt-1">
                Try adjusting your search or category filters.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                layout
              >
                {filtered.map((product, i) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProductCard product={product} index={i + 1} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {isOpen && (
          <div className="hidden lg:block flex-shrink-0" style={{ width: 320 }}>
            <div className="sticky top-20">
              <CartPanel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
