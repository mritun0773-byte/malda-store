import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface OrderItem {
    productId: string;
    quantity: bigint;
    priceAtOrder: bigint;
}
export interface Order {
    id: string;
    status: OrderStatus;
    deliveryAddress: string;
    createdAt: Time;
    totalAmount: bigint;
    customerId: Principal;
    stripePaymentIntentId: string;
    isCOD: boolean;
    items: Array<OrderItem>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface Product {
    id: string;
    name: string;
    unit: string;
    description: string;
    stockCount: bigint;
    imageUrl: string;
    category: GroceryCategory;
    rating: number;
    priceCents: bigint;
}
export interface UserProfile {
    name: string;
}
export enum GroceryCategory {
    bakery = "bakery",
    meatAndSeafood = "meatAndSeafood",
    dairyAndEggs = "dairyAndEggs",
    beverages = "beverages",
    produce = "produce"
}
export enum OrderStatus {
    cancelled = "cancelled",
    delivering = "delivering",
    pending = "pending",
    delivered = "delivered",
    confirmed = "confirmed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimAdminIfFirst(): Promise<boolean>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createOrder(items: Array<OrderItem>, totalAmount: bigint, deliveryAddress: string, stripePaymentIntentId: string, isCOD: boolean): Promise<string>;
    createProduct(product: Product): Promise<void>;
    deleteProduct(productId: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategories(): Promise<Array<GroceryCategory>>;
    getOrders(): Promise<Array<Order>>;
    getOrdersByCustomer(customerId: Principal): Promise<Array<Order>>;
    getProducts(): Promise<Array<Product>>;
    getProductsByCategory(category: GroceryCategory): Promise<Array<Product>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasAnyAdmin(): Promise<boolean>;
    isCODEnabled(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isCallerAdminOrOwner(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setCODEnabled(enabled: boolean): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
    updateProduct(product: Product): Promise<void>;
}
