import { GroceryCategory } from "../backend.d";

export const CATEGORY_EMOJI: Record<string, string> = {
  [GroceryCategory.produce]: "🥦",
  [GroceryCategory.meatAndSeafood]: "🥩",
  [GroceryCategory.dairyAndEggs]: "🥛",
  [GroceryCategory.bakery]: "🍞",
  [GroceryCategory.beverages]: "🧃",
};

export const CATEGORY_LABEL: Record<string, string> = {
  [GroceryCategory.produce]: "Produce",
  [GroceryCategory.meatAndSeafood]: "Meat & Seafood",
  [GroceryCategory.dairyAndEggs]: "Dairy & Eggs",
  [GroceryCategory.bakery]: "Bakery",
  [GroceryCategory.beverages]: "Beverages",
};

export const ALL_CATEGORIES = [
  GroceryCategory.produce,
  GroceryCategory.meatAndSeafood,
  GroceryCategory.dairyAndEggs,
  GroceryCategory.bakery,
  GroceryCategory.beverages,
];

export const SAMPLE_PRODUCTS = [
  {
    id: "sample-1",
    name: "Organic Bananas",
    unit: "per bunch",
    description: "Fresh organic bananas, perfect for smoothies or snacking",
    stockCount: BigInt(50),
    imageUrl:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop",
    category: GroceryCategory.produce,
    rating: 4.8,
    priceCents: BigInt(149),
  },
  {
    id: "sample-2",
    name: "Farm Fresh Eggs",
    unit: "per dozen",
    description: "Free-range large brown eggs from local farms",
    stockCount: BigInt(30),
    imageUrl:
      "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&h=300&fit=crop",
    category: GroceryCategory.dairyAndEggs,
    rating: 4.9,
    priceCents: BigInt(499),
  },
  {
    id: "sample-3",
    name: "Artisan Sourdough Bread",
    unit: "per loaf",
    description: "Stone-baked sourdough with crispy crust and chewy interior",
    stockCount: BigInt(20),
    imageUrl:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    category: GroceryCategory.bakery,
    rating: 4.7,
    priceCents: BigInt(649),
  },
  {
    id: "sample-4",
    name: "Atlantic Salmon Fillet",
    unit: "per lb",
    description: "Wild-caught Atlantic salmon, rich in omega-3 fatty acids",
    stockCount: BigInt(15),
    imageUrl:
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop",
    category: GroceryCategory.meatAndSeafood,
    rating: 4.6,
    priceCents: BigInt(1299),
  },
  {
    id: "sample-5",
    name: "Fresh Squeezed Orange Juice",
    unit: "32 fl oz",
    description:
      "Cold-pressed orange juice with no added sugars or preservatives",
    stockCount: BigInt(40),
    imageUrl:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop",
    category: GroceryCategory.beverages,
    rating: 4.5,
    priceCents: BigInt(399),
  },
  {
    id: "sample-6",
    name: "Baby Spinach",
    unit: "5 oz bag",
    description: "Tender baby spinach leaves, pre-washed and ready to eat",
    stockCount: BigInt(35),
    imageUrl:
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop",
    category: GroceryCategory.produce,
    rating: 4.7,
    priceCents: BigInt(349),
  },
];
