import { Button } from "@/components/ui/button";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { OrderItem } from "../backend.d";
import { useCart } from "../context/CartContext";
import { useActor } from "../hooks/useActor";

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/checkout/success" });
  const { actor } = useActor();
  const { items, totalCents, clearCart } = useCart();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [orderId, setOrderId] = useState<string | null>(null);
  const processed = useRef(false);

  const sessionId = (searchParams as { session_id?: string }).session_id ?? "";
  const deliveryAddress = decodeURIComponent(
    (searchParams as { address?: string }).address ?? "",
  );

  useEffect(() => {
    if (!sessionId || !actor || processed.current) return;
    processed.current = true;

    const processOrder = async () => {
      try {
        const sessionStatus = await actor.getStripeSessionStatus(sessionId);

        if (sessionStatus.__kind__ === "completed") {
          const orderItems: OrderItem[] = items.map((item) => ({
            productId: item.product.id,
            quantity: BigInt(item.quantity),
            priceAtOrder: item.product.priceCents,
          }));

          const deliveryFeeCents = 499n;
          const totalAmount = BigInt(totalCents) + deliveryFeeCents;

          const id = await actor.createOrder(
            orderItems,
            totalAmount,
            deliveryAddress,
            sessionId,
            false,
          );
          setOrderId(id);
          clearCart();
          setStatus("success");
        } else {
          setStatus("error");
          toast.error("Payment was not completed.");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        toast.error("Failed to process order.");
      }
    };

    processOrder();
  }, [sessionId, actor, items, totalCents, deliveryAddress, clearCart]);

  if (status === "loading") {
    return (
      <div
        data-ocid="checkout_success.loading_state"
        className="min-h-96 flex items-center justify-center"
      >
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Processing your order...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        data-ocid="checkout_success.error_state"
        className="min-h-96 flex items-center justify-center"
      >
        <div className="text-center max-w-md">
          <span className="text-6xl block mb-4">❌</span>
          <h2 className="text-2xl font-bold mb-2">Payment Issue</h2>
          <p className="text-muted-foreground mb-6">
            There was an issue processing your payment. Please try again or
            contact support.
          </p>
          <Button
            data-ocid="checkout_success.primary_button"
            onClick={() => navigate({ to: "/checkout" })}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-ocid="checkout_success.success_state"
      className="min-h-96 flex items-center justify-center"
    >
      <div className="text-center max-w-md">
        <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">Order Confirmed! 🎉</h2>
        <p className="text-muted-foreground mb-2">
          Your order has been placed successfully.
        </p>
        {orderId && (
          <p className="text-sm text-muted-foreground mb-6">
            Order ID:{" "}
            <span className="font-mono font-semibold text-foreground">
              {orderId.slice(0, 8)}...
            </span>
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Button
            data-ocid="checkout_success.secondary_button"
            variant="outline"
            onClick={() => navigate({ to: "/orders" })}
          >
            View Orders
          </Button>
          <Button
            data-ocid="checkout_success.primary_button"
            onClick={() =>
              navigate({ to: "/shop", search: { q: "", category: "" } })
            }
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
