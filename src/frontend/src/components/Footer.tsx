import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Leaf, Twitter } from "lucide-react";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer
      className="text-white/80 mt-16"
      style={{ background: "oklch(var(--navy-dark))" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              Malda Store
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Fresh groceries delivered to your door. Quality you can taste,
              convenience you&apos;ll love.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Home", to: "/" },
                { label: "Shop", to: "/shop" },
                { label: "My Orders", to: "/orders" },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-white font-semibold mb-3">Help</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>FAQ</li>
              <li>Delivery Info</li>
              <li>Return Policy</li>
              <li>Contact Us</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-3">Stay Updated</h3>
            <p className="text-sm text-white/60 mb-3">
              Subscribe for weekly deals and fresh arrivals.
            </p>
            <div className="flex gap-2">
              <Input
                data-ocid="footer.input"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm"
              />
              <Button
                data-ocid="footer.submit_button"
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Subscribe
              </Button>
            </div>
            <div className="flex gap-2 mt-4 items-center flex-wrap">
              <span className="text-xs text-white/50">We accept:</span>
              {["Visa", "MC", "Amex", "PayPal"].map((p) => (
                <span
                  key={p}
                  className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <p>
            &copy; {year}. Built with ❤️ using{" "}
            <a
              href={caffeineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white underline transition-colors"
            >
              caffeine.ai
            </a>
          </p>
          <p>Fresh groceries. Fast delivery. Happy customers.</p>
        </div>
      </div>
    </footer>
  );
}
