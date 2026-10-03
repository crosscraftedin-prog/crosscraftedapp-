"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Heart,
  Plus,
  Search,
  X,
  ShoppingCart,
  Store,
  MapPin,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import {
  PRODUCTS,
  CHURCH_GRADIENTS,
  type Product,
} from "@/lib/crosscrafted-data";

const CATEGORIES = ["All", "Bibles", "Books", "Music", "Apparel", "Gifts"];

const StarRating = ({ rating, size = 11 }: { rating: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={size}
        className={n <= Math.round(rating) ? "text-[#F59E0B]" : "text-white/15"}
        fill={n <= Math.round(rating) ? "currentColor" : "none"}
      />
    ))}
  </div>
);

export default function ShopView() {
  const [products] = useState<Product[]>(PRODUCTS);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openProduct, setOpenProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (activeCategory !== "All" && p.category !== activeCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q) &&
          !p.vendor.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [products, activeCategory, searchQuery]);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast("Removed from wishlist");
      } else {
        next.add(id);
        toast.success("Added to wishlist!");
      }
      return next;
    });
  };

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const next = new Set(prev);
      next.add(p.id);
      return next;
    });
    toast.success(`Added "${p.name}" to cart!`, {
      description: "Contact vendor on WhatsApp to checkout.",
    });
  };

  return (
    <div className="max-w-[680px] mx-auto px-4 py-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Marketplace</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">Bibles, books, music & more</p>
        </div>
        <div className="flex items-center gap-2">
          {cart.size > 0 && (
            <button className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]">
              <ShoppingCart size={14} />
              Cart
              <span className="w-4 h-4 rounded-full bg-[#22C55E] text-slate-950 text-[9px] flex items-center justify-center font-bold">
                {cart.size}
              </span>
            </button>
          )}
          <button
            onClick={() => toast("Listing flow coming soon!", { description: "For now, browse the catalog." })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: "linear-gradient(135deg, #9786E3, #38BDF8)" }}
          >
            <Plus size={14} /> List Item
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search products..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="neo-input text-sm mb-3"
      />

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 mb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? "bg-[#9786E3] text-white"
                : "bg-white/[0.04] text-[#94A3B8] hover:text-white border border-white/[0.06]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((product, i) => {
          const isWishlisted = wishlist.has(product.id);
          const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setOpenProduct(product)}
              className="bg-[#1C1929] border border-white/[0.06] rounded-2xl overflow-hidden cursor-pointer hover:border-white/[0.12] transition-all group"
            >
              <div
                className="relative h-32"
                style={{ background: CHURCH_GRADIENTS[product.cover_gradient] }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1929]/40 to-transparent" />
                {discount > 0 && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#EF4444] text-white text-[9px] font-bold uppercase tracking-wider">
                    -{discount}%
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center"
                >
                  <Heart
                    size={13}
                    className={isWishlisted ? "text-[#EC4899]" : "text-white/80"}
                    fill={isWishlisted ? "currentColor" : "none"}
                  />
                </button>
                {!product.in_stock && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] mb-0.5">
                  {product.category}
                </p>
                <h3 className="text-xs font-bold text-white mb-1 line-clamp-2 leading-tight min-h-[2rem]">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mb-1.5">
                  <StarRating rating={product.rating} />
                  <span className="text-[9px] text-[#94A3B8]">({product.reviews})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-white">₹{product.price}</span>
                  {product.mrp > product.price && (
                    <span className="text-[10px] text-[#94A3B8] line-through">₹{product.mrp}</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Search size={40} className="mx-auto text-[#475569] mb-3" />
          <p className="text-sm text-[#475569]">No products found.</p>
        </div>
      )}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {openProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center z-[60] p-0 md:p-6"
            onClick={(e) => e.target === e.currentTarget && setOpenProduct(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="bg-[#1C1929] border border-white/[0.08] rounded-t-[28px] md:rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div
                className="relative h-56"
                style={{ background: CHURCH_GRADIENTS[openProduct.cover_gradient] }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1929] via-transparent to-transparent" />
                <button
                  onClick={() => setOpenProduct(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white"
                >
                  <X size={18} />
                </button>
                {!openProduct.in_stock && (
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-[#EF4444]/90 text-white text-[10px] font-bold uppercase tracking-wider">
                    Out of Stock
                  </div>
                )}
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                    {openProduct.category}
                  </p>
                  <h2 className="text-xl font-extrabold text-white leading-tight mb-2">
                    {openProduct.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <StarRating rating={openProduct.rating} size={13} />
                    <span className="text-xs text-[#94A3B8]">
                      {openProduct.rating} · {openProduct.reviews} reviews
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">₹{openProduct.price}</span>
                  {openProduct.mrp > openProduct.price && (
                    <>
                      <span className="text-sm text-[#94A3B8] line-through">₹{openProduct.mrp}</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#22C55E]/15 text-[#22C55E] text-[10px] font-bold">
                        Save ₹{openProduct.mrp - openProduct.price}
                      </span>
                    </>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Description</p>
                  <p className="text-sm text-[#A09DB1] leading-relaxed">{openProduct.description}</p>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9786E3] to-[#38BDF8] flex items-center justify-center">
                    <Store size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Vendor</p>
                    <p className="text-sm font-bold text-white">{openProduct.vendor}</p>
                    <p className="text-[10px] text-[#94A3B8] flex items-center gap-1">
                      <MapPin size={9} /> {openProduct.city}
                    </p>
                  </div>
                  <Truck size={18} className="text-[#22C55E]" />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => toggleWishlist(openProduct.id)}
                    className={`px-4 rounded-xl border flex items-center justify-center transition-all ${
                      wishlist.has(openProduct.id)
                        ? "bg-[#EC4899]/15 border-[#EC4899]/30 text-[#EC4899]"
                        : "bg-white/[0.04] border-white/[0.06] text-[#94A3B8] hover:text-white"
                    }`}
                  >
                    <Heart size={18} fill={wishlist.has(openProduct.id) ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => {
                      addToCart(openProduct);
                      setOpenProduct(null);
                    }}
                    disabled={!openProduct.in_stock}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #9786E3, #38BDF8)" }}
                  >
                    <ShoppingCart size={16} /> Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
