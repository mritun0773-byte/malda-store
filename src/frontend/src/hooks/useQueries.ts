import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  GroceryCategory,
  OrderItem,
  OrderStatus,
  Product,
} from "../backend.d";
import { useActor } from "./useActor";

export function useProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProductsByCategory(category: GroceryCategory | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products", "category", category],
    queryFn: async () => {
      if (!actor || !category) return [];
      return actor.getProductsByCategory(category);
    },
    enabled: !!actor && !isFetching && !!category,
  });
}

export function useOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyOrders(principal: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["myOrders", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getOrdersByCustomer(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await (actor as any).isCallerAdminOrOwner();
      } catch {
        return actor.isCallerAdmin();
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useHasAnyAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["hasAnyAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await (actor as any).hasAnyAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useClaimAdmin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const result = await (actor as any).claimAdminIfFirst();
      if (!result)
        throw new Error("Admin already claimed or you are anonymous");
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["isAdmin"] });
      qc.invalidateQueries({ queryKey: ["hasAnyAdmin"] });
    },
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["stripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: { orderId: string; status: OrderStatus }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useCreateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor) throw new Error("No actor");
      return actor.createProduct(product);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor) throw new Error("No actor");
      return actor.updateProduct(product);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteProduct(productId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useSetStripeConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: {
      secretKey: string;
      allowedCountries: string[];
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stripeConfigured"] }),
  });
}

export function useIsCODEnabled() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["codEnabled"],
    queryFn: async () => {
      if (!actor) return true;
      return actor.isCODEnabled();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetCODEnabled() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("No actor");
      return actor.setCODEnabled(enabled);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["codEnabled"] }),
  });
}

export function useCreateOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      items: OrderItem[];
      totalAmount: bigint;
      deliveryAddress: string;
      stripePaymentIntentId: string;
      isCOD: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createOrder(
        params.items,
        params.totalAmount,
        params.deliveryAddress,
        params.stripePaymentIntentId,
        params.isCOD,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myOrders"] }),
  });
}
