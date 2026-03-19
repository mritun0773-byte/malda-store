import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
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

const HERO_SLIDES = [
  {
    title: "Welcome to\nMalda Store",
    subtitle:
      "Your neighbourhood grocery, delivered fast. Shop thousands of fresh products from Malda Store.",
    bg: "/assets/generated/grocery-hero.dim_1400x560.jpg",
  },
  {
    title: "Organic & Natural\nProduce",
    subtitle:
      "Locally sourced seasonal vegetables and fruits, delivered fresh daily.",
    bg: "/assets/generated/grocery-hero.dim_1400x560.jpg",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [heroIdx, setHeroIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("All Categories");
  const { isOpen } = useCart();

  const { data: products, isLoading } = useProducts();
  const displayProducts = (
    products && products.length > 0 ? products : SAMPLE_PRODUCTS
  ).slice(0, 6);

  const handleSearch = () => {
    navigate({
      to: "/shop",
      search: {
        q: search,
        category: selectedCategory !== "All Categories" ? selectedCategory : "",
      },
    });
  };

  return (
    <div>
      {/* Utility Row */}
      <div className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              data-ocid="search.select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-muted border border-border rounded-full px-4 py-2 pr-8 text-sm font-medium text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option>All Categories</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_EMOJI[cat]} {CATEGORY_LABEL[cat]}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="flex-1 flex gap-2">
            <Input
              data-ocid="search.input"
              placeholder="Search for groceries, vegetables, fruits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="rounded-full border-border"
            />
            <Button
              data-ocid="search.primary_button"
              onClick={handleSearch}
              style={{ background: "oklch(var(--navy))", color: "white" }}
              className="rounded-full px-6 hover:opacity-90"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section
        data-ocid="hero.section"
        className="relative overflow-hidden"
        style={{ height: 480 }}
      >
        <img
          src={HERO_SLIDES[heroIdx].bg}
          alt="Fresh groceries"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(11,27,46,0.85) 45%, transparent 100%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center">
          <motion.div
            key={heroIdx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            <h1
              className="text-white font-extrabold leading-tight mb-4"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                lineHeight: 1.1,
                whiteSpace: "pre-line",
              }}
            >
              {HERO_SLIDES[heroIdx].title}
            </h1>
            <p className="text-white/80 text-lg mb-6 leading-relaxed">
              {HERO_SLIDES[heroIdx].subtitle}
            </p>
            <Button
              data-ocid="hero.primary_button"
              onClick={() =>
                navigate({ to: "/shop", search: { q: "", category: "" } })
              }
              className="bg-white font-bold rounded-full px-8 py-3 text-base hover:bg-white/90 transition-colors"
              style={{ color: "oklch(var(--navy))" }}
            >
              Shop Now
            </Button>
          </motion.div>
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {HERO_SLIDES.map((slide, i) => (
            <button
              type="button"
              key={slide.title}
              onClick={() => setHeroIdx(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === heroIdx ? "bg-white" : "bg-white/40"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="font-bold text-foreground text-2xl mb-6">
          Popular Categories
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {ALL_CATEGORIES.map((cat) => (
            <motion.button
              type="button"
              key={cat}
              data-ocid={`category.${cat}.button`}
              whileHover={{ y: -2 }}
              onClick={() =>
                navigate({ to: "/shop", search: { category: cat, q: "" } })
              }
              className="flex flex-col items-center gap-3 bg-card border border-border rounded-xl p-4 shadow-card hover:border-primary hover:shadow-md transition-all"
            >
              <span className="text-4xl">{CATEGORY_EMOJI[cat]}</span>
              <span className="text-sm font-medium text-foreground text-center leading-tight">
                {CATEGORY_LABEL[cat]}
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Featured Products + Cart Panel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-start gap-6">
          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-foreground text-2xl">
                Featured Products
              </h2>
              <Button
                data-ocid="featured.secondary_button"
                variant="outline"
                onClick={() =>
                  navigate({ to: "/shop", search: { q: "", category: "" } })
                }
                className="text-primary border-primary hover:bg-primary hover:text-white text-sm"
              >
                View All
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {["s1", "s2", "s3", "s4", "s5", "s6"].map((id) => (
                  <div
                    key={id}
                    className="rounded-xl overflow-hidden border border-border"
                  >
                    <Skeleton className="h-44 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-9 w-full mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-3 gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.06 } },
                }}
              >
                {displayProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <ProductCard product={product} index={i + 1} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Cart Panel */}
          {isOpen && (
            <div
              className="hidden lg:block flex-shrink-0"
              style={{ width: 320 }}
            >
              <CartPanel />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
