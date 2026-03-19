import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMyOrders } from "../hooks/useQueries";

const STEPS = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: Package },
  { key: "delivering", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const STEP_ORDER: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  delivering: 2,
  delivered: 3,
};

function formatRupees(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

function getStatusFromVariant(status: any): string {
  if (typeof status === "string") return status;
  if (status && typeof status === "object") {
    const key = Object.keys(status)[0];
    return key ?? "pending";
  }
  return "pending";
}

function StatusTimeline({ statusKey }: { statusKey: string }) {
  if (statusKey === "cancelled") {
    return (
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        <XCircle className="h-4 w-4 text-destructive" />
        <Badge variant="destructive" className="text-xs">
          Order Cancelled
        </Badge>
      </div>
    );
  }

  const currentIdx = STEP_ORDER[statusKey] ?? 0;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isFuture = idx > currentIdx;
          return (
            <div
              key={step.key}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone
                      ? "bg-primary border-primary text-primary-foreground"
                      : isActive
                        ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/20"
                        : "bg-muted border-muted-foreground/20 text-muted-foreground/40"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${isFuture ? "opacity-30" : ""}`}
                  />
                </div>
                <span
                  className={`text-xs font-medium leading-tight text-center max-w-[60px] ${
                    isDone || isActive
                      ? "text-foreground"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 mb-5 rounded-full transition-all ${
                    idx < currentIdx ? "bg-primary" : "bg-muted-foreground/20"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderRow({ order, index }: { order: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const statusKey = getStatusFromVariant(order.status);
  const date = new Date(Number(order.createdAt / 1_000_000n));

  return (
    <div
      data-ocid={`orders.item.${index}`}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground">
              {date.toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold">
            {formatRupees(Number(order.totalAmount))}
          </span>
          {statusKey === "cancelled" ? (
            <Badge variant="destructive" className="text-xs">
              Cancelled
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className={`text-xs capitalize ${
                statusKey === "delivered"
                  ? "border-green-400 text-green-600"
                  : statusKey === "delivering"
                    ? "border-orange-400 text-orange-600"
                    : statusKey === "confirmed"
                      ? "border-blue-400 text-blue-600"
                      : "border-yellow-400 text-yellow-600"
              }`}
            >
              {statusKey === "delivering" ? "Out for Delivery" : statusKey}
            </Badge>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Status timeline always visible below header */}
      <div className="px-4 pb-2">
        <StatusTimeline statusKey={statusKey} />
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {order.deliveryAddress && (
            <div className="flex items-start gap-2 text-sm bg-muted/30 rounded-lg p-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-muted-foreground">{order.deliveryAddress}</p>
            </div>
          )}
          <div className="space-y-2">
            {order.items.map((item: any, i: number) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: order items have no stable id
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.productId.slice(0, 8)}... × {Number(item.quantity)}
                </span>
                <span className="font-medium">
                  {formatRupees(Number(item.priceAtOrder))} each
                </span>
              </div>
            ))}
          </div>
          {order.isCOD && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              💵 Cash on Delivery
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { identity, login } = useInternetIdentity();
  const navigate = useNavigate();
  const principal = identity?.getPrincipal().toString() ?? null;
  const { data: orders, isLoading } = useMyOrders(principal);

  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-40" />
        <h2 className="text-2xl font-bold mb-2">View Your Orders</h2>
        <p className="text-muted-foreground mb-6">
          Please log in to see your order history.
        </p>
        <Button data-ocid="orders.login.button" onClick={login}>
          Login to Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">My Orders</h1>
      <p className="text-muted-foreground mb-8">
        Track and manage your grocery deliveries.
      </p>

      {isLoading ? (
        <div data-ocid="orders.loading_state" className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div data-ocid="orders.empty_state" className="text-center py-16">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="font-semibold text-lg">No orders yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-6">
            Your order history will appear here after your first purchase.
          </p>
          <Button
            data-ocid="orders.primary_button"
            onClick={() =>
              navigate({ to: "/shop", search: { q: "", category: "" } })
            }
          >
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <OrderRow key={order.id} order={order} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
