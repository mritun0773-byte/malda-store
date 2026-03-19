import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Smartphone,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { useActor } from "../hooks/useActor";
import { useCreateOrder, useIsCODEnabled } from "../hooks/useQueries";

type PaymentMethod = "card" | "googlepay" | "phonepe" | "cod";

function formatRupees(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

const BASE_PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "card",
    label: "Credit / Debit Card",
    description: "Visa, Mastercard, RuPay",
    icon: "💳",
  },
  {
    id: "googlepay",
    label: "Google Pay",
    description: "Pay via UPI",
    icon: "G",
  },
  { id: "phonepe", label: "PhonePe", description: "Pay via UPI", icon: "Pe" },
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay when delivered",
    icon: "💵",
  },
];

export default function CheckoutPage() {
  const { items, totalCents, clearCart } = useCart();
  const navigate = useNavigate();
  const { actor } = useActor();

  // Structured address fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [pinCode, setPinCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [upiId, setUpiId] = useState("");
  const [upiRedirectState, setUpiRedirectState] = useState<
    null | "redirecting" | "success"
  >(null);
  const [redirectMessage, setRedirectMessage] = useState("");
  const [codSuccess, setCodSuccess] = useState(false);
  const [codOrderTotal, setCodOrderTotal] = useState(0);

  const { data: isCODEnabled } = useIsCODEnabled();
  const createOrder = useCreateOrder();

  const deliveryFeeCents = items.length > 0 ? 4900 : 0;
  const totalWithDelivery = totalCents + deliveryFeeCents;

  const PAYMENT_METHODS = BASE_PAYMENT_METHODS.filter(
    (m) => m.id !== "cod" || isCODEnabled,
  );

  const buildFullAddress = () => {
    const parts = [
      fullName,
      addressLine1,
      addressLine2,
      `${city}, ${stateField} - ${pinCode}`,
      `Phone: ${phone}`,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const validateAddress = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return false;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number.");
      return false;
    }
    if (!addressLine1.trim()) {
      toast.error("Please enter your address.");
      return false;
    }
    if (!city.trim()) {
      toast.error("Please enter your city.");
      return false;
    }
    if (!stateField.trim()) {
      toast.error("Please enter your state.");
      return false;
    }
    if (!pinCode.trim()) {
      toast.error("Please enter your PIN code.");
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateAddress()) return;
    if (!actor) {
      toast.error("Please login to proceed to checkout.");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    const fullAddress = buildFullAddress();

    if (paymentMethod === "cod") {
      setIsLoading(true);
      try {
        const orderItems = items.map((item) => ({
          productId: item.product.id,
          quantity: BigInt(item.quantity),
          priceAtOrder: item.product.priceCents,
        }));
        await createOrder.mutateAsync({
          items: orderItems,
          totalAmount: BigInt(totalWithDelivery),
          deliveryAddress: fullAddress,
          stripePaymentIntentId: "",
          isCOD: true,
        });
        setCodOrderTotal(totalWithDelivery);
        setCodSuccess(true);
        clearCart();
      } catch (err) {
        console.error(err);
        toast.error("Failed to place order. Please try again.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (paymentMethod === "googlepay" || paymentMethod === "phonepe") {
      if (!upiId.trim() || !upiId.includes("@")) {
        toast.error("Please enter a valid UPI ID (e.g. name@okaxis).");
        return;
      }
      const methodName =
        paymentMethod === "googlepay" ? "Google Pay" : "PhonePe";
      setRedirectMessage(`Redirecting to ${methodName}...`);
      setUpiRedirectState("redirecting");
      setTimeout(() => {
        setUpiRedirectState("success");
        setRedirectMessage(
          `Payment of ${formatRupees(totalWithDelivery)} via ${methodName} successful!`,
        );
      }, 2000);
      return;
    }

    // Stripe card flow
    setIsLoading(true);
    try {
      const shoppingItems = items.map((item) => ({
        productName: item.product.name,
        currency: "inr",
        quantity: BigInt(item.quantity),
        priceInCents: item.product.priceCents,
        productDescription: item.product.description,
      }));

      const successUrl = `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&address=${encodeURIComponent(fullAddress)}`;
      const cancelUrl = `${window.location.origin}/checkout`;

      const sessionUrl = await actor.createCheckoutSession(
        shoppingItems,
        successUrl,
        cancelUrl,
      );
      window.location.href = sessionUrl;
    } catch (err) {
      console.error(err);
      toast.error("Failed to create checkout session. Please try again.");
      setIsLoading(false);
    }
  };

  if (items.length === 0 && !codSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <span className="text-6xl block mb-4">🛒</span>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">
          Add some items before checking out.
        </p>
        <Button
          data-ocid="checkout.primary_button"
          onClick={() =>
            navigate({ to: "/shop", search: { q: "", category: "" } })
          }
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  // COD success screen
  if (codSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <motion.div
          data-ocid="checkout.success_state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-card border border-border rounded-2xl p-10"
        >
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
          <p className="text-muted-foreground mb-2">
            Pay{" "}
            <span className="font-bold text-foreground">
              {formatRupees(codOrderTotal)}
            </span>{" "}
            on delivery.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Our delivery partner will collect the payment when your order
            arrives.
          </p>
          <Button
            data-ocid="checkout.primary_button"
            onClick={() => navigate({ to: "/orders" })}
            className="gap-2"
          >
            Go to My Orders
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        type="button"
        data-ocid="checkout.back.button"
        onClick={() => navigate({ to: "/" })}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Shopping
      </button>

      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: Address + Payment Method */}
        <div className="space-y-6">
          {/* Delivery Address */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Delivery Address</h2>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    data-ocid="checkout.name.input"
                    id="fullName"
                    placeholder="Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    data-ocid="checkout.phone.input"
                    id="phone"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="addressLine1">
                  Address Line 1 <span className="text-destructive">*</span>
                </Label>
                <Input
                  data-ocid="checkout.address.input"
                  id="addressLine1"
                  placeholder="Flat 4B, 123 MG Road"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="addressLine2">
                  Address Line 2{" "}
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  data-ocid="checkout.address2.input"
                  id="addressLine2"
                  placeholder="Near City Mall, Landmark"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    data-ocid="checkout.city.input"
                    id="city"
                    placeholder="Kolkata"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="state">
                    State <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    data-ocid="checkout.state.input"
                    id="state"
                    placeholder="West Bengal"
                    value={stateField}
                    onChange={(e) => setStateField(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="pin">
                    PIN Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    data-ocid="checkout.zip.input"
                    id="pin"
                    placeholder="700001"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Payment Method</h2>
            </div>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  data-ocid={`checkout.${method.id}.toggle`}
                  onClick={() => {
                    setPaymentMethod(method.id);
                    setUpiRedirectState(null);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    paymentMethod === method.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-lg shrink-0 ${
                      method.id === "googlepay"
                        ? "bg-white border border-gray-200 text-blue-600 shadow-sm"
                        : method.id === "phonepe"
                          ? "bg-[#5f259f] text-white"
                          : method.id === "cod"
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                            : "bg-primary/10 text-primary"
                    }`}
                  >
                    {method.id === "card" ? (
                      <CreditCard className="h-6 w-6" />
                    ) : method.id === "cod" ? (
                      <Banknote className="h-6 w-6" />
                    ) : (
                      method.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{method.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {method.description}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      paymentMethod === method.id
                        ? "border-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {paymentMethod === method.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* UPI ID input */}
            <AnimatePresence>
              {(paymentMethod === "googlepay" ||
                paymentMethod === "phonepe") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-border">
                    <Label htmlFor="upiId" className="text-sm font-medium">
                      UPI ID
                    </Label>
                    <Input
                      data-ocid="checkout.upi.input"
                      id="upiId"
                      placeholder="yourname@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter your UPI ID linked to{" "}
                      {paymentMethod === "googlepay" ? "Google Pay" : "PhonePe"}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* COD info */}
            <AnimatePresence>
              {paymentMethod === "cod" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Banknote className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                        Cash on Delivery
                      </p>
                    </div>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">
                      Keep exact change ready. Our delivery partner will collect
                      payment on arrival.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Order Summary</h2>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="space-y-3 mb-4">
              {items.map((item, idx) => (
                <div
                  key={item.product.id}
                  data-ocid={`checkout.item.${idx + 1}`}
                  className="flex justify-between items-start"
                >
                  <div>
                    <p className="text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRupees(Number(item.product.priceCents))} ×{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatRupees(
                      Number(item.product.priceCents) * item.quantity,
                    )}
                  </p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatRupees(totalCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>{formatRupees(deliveryFeeCents)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatRupees(totalWithDelivery)}</span>
              </div>
            </div>

            {/* UPI redirect states */}
            <AnimatePresence mode="wait">
              {upiRedirectState === "redirecting" && (
                <motion.div
                  key="redirecting"
                  data-ocid="checkout.loading_state"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-5 flex flex-col items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-center">
                    {redirectMessage}
                  </p>
                </motion.div>
              )}
              {upiRedirectState === "success" && (
                <motion.div
                  key="success"
                  data-ocid="checkout.success_state"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-5 flex flex-col items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800"
                >
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <p className="text-sm font-semibold text-center text-green-700 dark:text-green-400">
                    {redirectMessage}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Your order has been placed successfully!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {upiRedirectState !== "success" && (
              <Button
                data-ocid="checkout.submit_button"
                onClick={handleCheckout}
                disabled={
                  isLoading ||
                  upiRedirectState === "redirecting" ||
                  createOrder.isPending
                }
                className={`w-full mt-6 font-bold py-3 text-base ${
                  paymentMethod === "cod"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-brand-yellow hover:bg-brand-yellow/90 text-accent-foreground"
                }`}
              >
                {isLoading || createOrder.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : paymentMethod === "card" ? (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay with Card
                  </>
                ) : paymentMethod === "googlepay" ? (
                  <span className="flex items-center gap-2 font-bold">
                    <span className="text-base font-black">G</span> Pay with
                    Google Pay
                  </span>
                ) : paymentMethod === "phonepe" ? (
                  <span className="flex items-center gap-2 font-bold">
                    <span className="text-base font-black">Pe</span> Pay with
                    PhonePe
                  </span>
                ) : (
                  <span className="flex items-center gap-2 font-bold">
                    <Banknote className="h-4 w-4" /> Place Order - Pay on
                    Delivery
                  </span>
                )}
              </Button>
            )}
            <p className="text-xs text-center text-muted-foreground mt-3">
              🔒 100% Secure Payments
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
