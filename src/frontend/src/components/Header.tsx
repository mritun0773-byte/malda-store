import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { Leaf, Menu, ShoppingCart, User, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function Header() {
  const { totalItems, totalCents, setIsOpen } = useCart();
  const { login, clear, identity, loginStatus } = useInternetIdentity();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Shop", to: "/shop" },
    { label: "My Orders", to: "/orders" },
    ...(isLoggedIn ? [{ label: "Admin", to: "/admin" }] : []),
  ];

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{ background: "oklch(var(--navy))" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link
            data-ocid="header.link"
            to="/"
            className="flex items-center gap-2 text-white font-bold text-xl"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            Malda Store
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                data-ocid={`header.${link.label.toLowerCase().replace(" ", "_")}.link`}
                className="text-white/80 hover:text-white font-medium text-sm transition-colors"
                activeProps={{ className: "text-white font-semibold" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <button
              type="button"
              data-ocid="header.cart.button"
              onClick={() => {
                navigate({ to: "/" });
                setIsOpen(true);
              }}
              className="flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellow/90 text-accent-foreground font-semibold text-sm px-3 py-1.5 rounded-full transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{totalItems}</span>
              {totalCents > 0 && (
                <span className="border-l border-black/20 pl-2">
                  ₹{(totalCents / 100).toFixed(2)}
                </span>
              )}
            </button>

            {/* Auth */}
            {isLoggedIn ? (
              <button
                type="button"
                data-ocid="header.user.button"
                onClick={clear}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
              >
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Button
                data-ocid="header.login.button"
                onClick={login}
                disabled={isLoggingIn}
                variant="outline"
                size="sm"
                className="border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white text-sm"
              >
                <User className="h-4 w-4 mr-1" />
                {isLoggingIn ? "Logging in..." : "Login"}
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="md:hidden text-white p-1"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden pb-3 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="text-white/80 hover:text-white font-medium text-sm py-2 px-2 rounded transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
