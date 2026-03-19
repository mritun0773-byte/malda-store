import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useCart } from "../context/CartContext";

function formatRupees(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function CartPanel() {
  const {
    items,
    removeItem,
    updateQuantity,
    totalCents,
    totalItems,
    isOpen,
    setIsOpen,
  } = useCart();
  const navigate = useNavigate();
  const subtotalCents = totalCents;
  const deliveryFeeCents = subtotalCents > 0 ? 499 : 0;
  const totalWithDeliveryCents = subtotalCents + deliveryFeeCents;

  if (!isOpen) return null;

  return (
    <div
      data-ocid="cart.panel"
      className="bg-card rounded-xl border border-border shadow-card flex flex-col"
      style={{ minWidth: 300, maxWidth: 340 }}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-foreground">Shopping Cart</h2>
          {totalItems > 0 && (
            <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-semibold">
              {totalItems}
            </span>
          )}
        </div>
        <button
          type="button"
          data-ocid="cart.close_button"
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close cart"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {items.length === 0 ? (
        <div
          data-ocid="cart.empty_state"
          className="p-8 text-center text-muted-foreground"
        >
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Your cart is empty</p>
          <p className="text-xs mt-1">Add items to get started!</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto max-h-80 p-3 space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.product.id}
                data-ocid={`cart.item.${idx + 1}`}
                className="flex gap-3"
              >
                <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      🛒
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.product.unit}
                  </p>
                  <p className="text-sm font-bold text-primary mt-0.5">
                    {formatRupees(Number(item.product.priceCents))}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    type="button"
                    data-ocid={`cart.delete_button.${idx + 1}`}
                    onClick={() => removeItem(item.product.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Remove ${item.product.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                      className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                      className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatRupees(subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="font-medium">
                {formatRupees(deliveryFeeCents)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatRupees(totalWithDeliveryCents)}</span>
            </div>
            <Button
              data-ocid="cart.submit_button"
              onClick={() => {
                setIsOpen(false);
                navigate({ to: "/checkout" });
              }}
              className="w-full bg-brand-yellow hover:bg-brand-yellow/90 text-accent-foreground font-bold mt-2"
            >
              Proceed to Checkout
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
