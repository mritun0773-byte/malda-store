import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { HttpAgent } from "@icp-sdk/core/agent";
import {
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { OrderStatus, Product } from "../backend.d";
import { GroceryCategory } from "../backend.d";
import { loadConfig } from "../config";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useClaimAdmin,
  useCreateProduct,
  useDeleteProduct,
  useHasAnyAdmin,
  useIsAdmin,
  useIsCODEnabled,
  useOrders,
  useProducts,
  useSetCODEnabled,
  useSetStripeConfig,
  useUpdateOrderStatus,
  useUpdateProduct,
} from "../hooks/useQueries";
import {
  ALL_CATEGORIES,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
} from "../lib/categoryUtils";
import { StorageClient } from "../utils/StorageClient";

const ORDER_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "delivering", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function statusVariantFromKey(key: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    pending: { pending: null } as any,
    confirmed: { confirmed: null } as any,
    delivering: { delivering: null } as any,
    delivered: { delivered: null } as any,
    cancelled: { cancelled: null } as any,
  };
  return map[key] ?? ({ pending: null } as any);
}

function getStatusKey(status: any): string {
  if (typeof status === "string") return status;
  if (status && typeof status === "object") {
    return Object.keys(status)[0] ?? "pending";
  }
  return "pending";
}

const EMPTY_PRODUCT: Omit<Product, "id"> = {
  name: "",
  unit: "",
  description: "",
  stockCount: BigInt(0),
  imageUrl: "",
  category: GroceryCategory.produce,
  rating: 4.5,
  priceCents: BigInt(0),
};

function formatRupees(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

async function uploadImageFile(file: File): Promise<string> {
  const config = await loadConfig();
  const agent = new HttpAgent({ host: config.backend_host });
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch(() => {});
  }
  const storageClient = new StorageClient(
    config.bucket_name,
    config.storage_gateway_url,
    config.backend_canister_id,
    config.project_id,
    agent,
  );
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { hash } = await storageClient.putFile(bytes);
  return storageClient.getDirectURL(hash);
}

function ImageUploadField({
  value,
  onChange,
  onUploading,
}: {
  value: string;
  onChange: (url: string) => void;
  onUploading: (uploading: boolean) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    onUploading(true);
    try {
      const url = await uploadImageFile(file);
      onChange(url);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Failed to upload image.");
    } finally {
      setIsUploading(false);
      onUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>Product Image</Label>
      <div className="flex items-center gap-3 mt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-ocid="admin.product.upload_button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
          {isUploading ? "Uploading..." : "Upload Image"}
        </Button>
        {value && (
          <img
            src={value}
            alt="Product preview"
            className="rounded border border-border object-cover"
            style={{ width: 80, height: 80 }}
          />
        )}
        {!value && !isUploading && (
          <span className="text-xs text-muted-foreground">
            No image selected
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />
      <p className="text-xs text-muted-foreground">JPG or PNG only</p>
    </div>
  );
}

function ProductForm({
  initial,
  onSave,
  isPending,
  onClose,
}: {
  initial: Product | null;
  onSave: (p: Product) => void;
  isPending: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Product>(
    initial ?? { id: crypto.randomUUID(), ...EMPTY_PRODUCT },
  );
  const [isImageUploading, setIsImageUploading] = useState(false);

  const set = (key: keyof Product, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Product Name</Label>
          <Input
            data-ocid="admin.product.name.input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="mt-1"
            placeholder="Organic Bananas"
          />
        </div>
        <div>
          <Label>Unit</Label>
          <Input
            data-ocid="admin.product.unit.input"
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
            className="mt-1"
            placeholder="per kg"
          />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          data-ocid="admin.product.description.textarea"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="mt-1"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Price (paise)</Label>
          <Input
            data-ocid="admin.product.price.input"
            type="number"
            value={Number(form.priceCents)}
            onChange={(e) => set("priceCents", BigInt(e.target.value || "0"))}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Stock</Label>
          <Input
            data-ocid="admin.product.stock.input"
            type="number"
            value={Number(form.stockCount)}
            onChange={(e) => set("stockCount", BigInt(e.target.value || "0"))}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Rating</Label>
          <Input
            data-ocid="admin.product.rating.input"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={form.rating}
            onChange={(e) =>
              set("rating", Number.parseFloat(e.target.value) || 0)
            }
            className="mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => set("category", v as GroceryCategory)}
          >
            <SelectTrigger
              data-ocid="admin.product.category.select"
              className="mt-1"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_EMOJI[cat]} {CATEGORY_LABEL[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ImageUploadField
          value={form.imageUrl}
          onChange={(url) => set("imageUrl", url)}
          onUploading={setIsImageUploading}
        />
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          data-ocid="admin.product.cancel_button"
        >
          Cancel
        </Button>
        <Button
          data-ocid="admin.product.save_button"
          onClick={() => onSave(form)}
          disabled={isPending || isImageUploading || !form.name}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Product
        </Button>
      </DialogFooter>
    </div>
  );
}

function ProductsTab() {
  const { data: products, isLoading } = useProducts();
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = async (p: Product) => {
    try {
      if (editProduct) {
        await updateMut.mutateAsync(p);
        toast.success("Product updated!");
      } else {
        await createMut.mutateAsync(p);
        toast.success("Product created!");
      }
      setDialogOpen(false);
      setEditProduct(null);
    } catch {
      toast.error("Failed to save product.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Product deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete product.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">
          Products ({products?.length ?? 0})
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="admin.products.open_modal_button"
              onClick={() => {
                setEditProduct(null);
                setDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="admin.product.dialog" className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <ProductForm
              initial={editProduct}
              onSave={handleSave}
              isPending={createMut.isPending || updateMut.isPending}
              onClose={() => {
                setDialogOpen(false);
                setEditProduct(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div data-ocid="admin.products.loading_state" className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <Table data-ocid="admin.products.table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(products ?? []).map((product, i) => (
                <TableRow
                  key={product.id}
                  data-ocid={`admin.product.item.${i + 1}`}
                >
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {CATEGORY_EMOJI[product.category]}{" "}
                      {CATEGORY_LABEL[product.category]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatRupees(Number(product.priceCents))}
                  </TableCell>
                  <TableCell>{Number(product.stockCount)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        data-ocid={`admin.product.edit_button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditProduct(product);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Dialog
                        open={deleteId === product.id}
                        onOpenChange={(o) => !o && setDeleteId(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            data-ocid={`admin.product.delete_button.${i + 1}`}
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setDeleteId(product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-ocid="admin.delete.dialog">
                          <DialogHeader>
                            <DialogTitle>Delete Product?</DialogTitle>
                          </DialogHeader>
                          <p className="text-muted-foreground text-sm">
                            Are you sure you want to delete{" "}
                            <strong>{product.name}</strong>? This cannot be
                            undone.
                          </p>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              data-ocid="admin.delete.cancel_button"
                              onClick={() => setDeleteId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              data-ocid="admin.delete.confirm_button"
                              variant="destructive"
                              onClick={() => handleDelete(product.id)}
                              disabled={deleteMut.isPending}
                            >
                              {deleteMut.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function OrdersTab() {
  const { data: orders, isLoading } = useOrders();
  const updateMut = useUpdateOrderStatus();

  const handleStatusChange = async (orderId: string, statusKey: string) => {
    try {
      await updateMut.mutateAsync({
        orderId,
        status: statusVariantFromKey(statusKey),
      });
      toast.success("Order status updated.");
    } catch {
      toast.error("Failed to update status.");
    }
  };

  return (
    <div>
      <h2 className="font-bold text-lg mb-4">
        All Orders ({orders?.length ?? 0})
      </h2>
      {isLoading ? (
        <div data-ocid="admin.orders.loading_state" className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div
          data-ocid="admin.orders.empty_state"
          className="text-center py-12 text-muted-foreground"
        >
          No orders found.
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-auto">
          <Table data-ocid="admin.orders.table">
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Delivery Address</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order, i) => {
                const statusKey = getStatusKey(order.status);
                const statusOption = ORDER_STATUS_OPTIONS.find(
                  (s) => s.value === statusKey,
                );
                return (
                  <TableRow
                    key={order.id}
                    data-ocid={`admin.order.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs">
                      {order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {String(order.customerId).slice(0, 10)}…
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell>
                      {formatRupees(Number(order.totalAmount))}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                      {order.deliveryAddress || "—"}
                    </TableCell>
                    <TableCell>
                      {order.isCOD ? (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-300"
                        >
                          COD
                        </Badge>
                      ) : (
                        <Badge variant="outline">Online</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize text-xs ${
                          statusKey === "delivered"
                            ? "border-green-400 text-green-600"
                            : statusKey === "delivering"
                              ? "border-orange-400 text-orange-600"
                              : statusKey === "confirmed"
                                ? "border-blue-400 text-blue-600"
                                : statusKey === "cancelled"
                                  ? "border-red-400 text-red-600"
                                  : "border-yellow-400 text-yellow-600"
                        }`}
                      >
                        {statusOption?.label ?? statusKey}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={statusKey}
                        onValueChange={(v) => handleStatusChange(order.id, v)}
                      >
                        <SelectTrigger
                          data-ocid={`admin.order.status.select.${i + 1}`}
                          className="w-40 h-8 text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUS_OPTIONS.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="text-xs"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function StripeTab() {
  const [secretKey, setSecretKey] = useState("");
  const [countries, setCountries] = useState("IN");
  const setConfig = useSetStripeConfig();

  const handleSave = async () => {
    if (!secretKey) {
      toast.error("Enter a secret key.");
      return;
    }
    try {
      await setConfig.mutateAsync({
        secretKey,
        allowedCountries: countries
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      });
      toast.success("Stripe configured!");
      setSecretKey("");
    } catch {
      toast.error("Failed to save Stripe config.");
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="font-bold text-lg mb-4">Stripe Configuration</h2>
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div>
          <Label htmlFor="stripe-key">Stripe Secret Key</Label>
          <Input
            data-ocid="admin.stripe.key.input"
            id="stripe-key"
            type="password"
            placeholder="sk_live_..."
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="mt-1 font-mono"
          />
        </div>
        <div>
          <Label htmlFor="countries">Allowed Countries (comma-separated)</Label>
          <Input
            data-ocid="admin.stripe.countries.input"
            id="countries"
            placeholder="IN"
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button
          data-ocid="admin.stripe.save_button"
          onClick={handleSave}
          disabled={setConfig.isPending}
          className="w-full"
        >
          {setConfig.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Save Stripe Configuration
        </Button>
      </div>
    </div>
  );
}

function SettingsTab() {
  const { data: isCODEnabled, isLoading } = useIsCODEnabled();
  const setCODEnabled = useSetCODEnabled();

  const handleToggle = async (enabled: boolean) => {
    try {
      await setCODEnabled.mutateAsync(enabled);
      toast.success(
        enabled ? "Cash on Delivery enabled." : "Cash on Delivery disabled.",
      );
    } catch {
      toast.error("Failed to update setting.");
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="font-bold text-lg mb-4">Store Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cash on Delivery</CardTitle>
          <CardDescription>
            Allow customers to pay when their order is delivered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable COD</p>
              <p className="text-xs text-muted-foreground">
                {isCODEnabled
                  ? "Customers can choose to pay on delivery"
                  : "COD is currently disabled"}
              </p>
            </div>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                data-ocid="admin.settings.cod.switch"
                checked={isCODEnabled ?? false}
                onCheckedChange={handleToggle}
                disabled={setCODEnabled.isPending}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  const { identity, login } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: hasAnyAdmin, isLoading: hasAdminLoading } = useHasAnyAdmin();
  const claimAdmin = useClaimAdmin();

  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShieldAlert className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-40" />
        <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
        <p className="text-muted-foreground mb-6">
          Please log in to access the admin dashboard.
        </p>
        <Button data-ocid="admin.login.button" onClick={login}>
          Login
        </Button>
      </div>
    );
  }

  if (adminLoading || hasAdminLoading) {
    return (
      <div
        data-ocid="admin.loading_state"
        className="max-w-5xl mx-auto px-4 py-8"
      >
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!isAdmin && !hasAnyAdmin) {
    return (
      <div
        data-ocid="admin.claim_state"
        className="max-w-2xl mx-auto px-4 py-16 text-center"
      >
        <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4 opacity-80" />
        <h2 className="text-2xl font-bold mb-2">Set Up Admin Access</h2>
        <p className="text-muted-foreground mb-6">
          No admin has been set up yet. Click below to make yourself the store
          admin. This can only be done once.
        </p>
        <Button
          data-ocid="admin.claim_button"
          onClick={async () => {
            try {
              await claimAdmin.mutateAsync();
              toast.success("You are now the admin!");
            } catch {
              toast.error(
                "Could not claim admin. Someone may have already set it up.",
              );
            }
          }}
          disabled={claimAdmin.isPending}
          size="lg"
        >
          {claimAdmin.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Claim Admin Access
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        data-ocid="admin.error_state"
        className="max-w-2xl mx-auto px-4 py-16 text-center"
      >
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4 opacity-60" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have admin privileges. Contact the store owner for access.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Manage products, orders, and settings.
      </p>

      <Tabs defaultValue="products" data-ocid="admin.panel">
        <TabsList className="mb-6">
          <TabsTrigger data-ocid="admin.products.tab" value="products">
            Products
          </TabsTrigger>
          <TabsTrigger data-ocid="admin.orders.tab" value="orders">
            Orders
          </TabsTrigger>
          <TabsTrigger data-ocid="admin.stripe.tab" value="stripe">
            Stripe
          </TabsTrigger>
          <TabsTrigger data-ocid="admin.settings.tab" value="settings">
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="stripe">
          <StripeTab />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
