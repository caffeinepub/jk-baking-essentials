import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Product {
    id: string;
    stockQuantity: bigint;
    name: string;
    pricePaise: bigint;
    description: string;
    category: ProductCategory;
}
export interface CartItem {
    productId: string;
    quantity: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface OrderItem {
    name: string;
    pricePaise: bigint;
    productId: string;
    quantity: bigint;
}
export interface Order {
    id: string;
    status: OrderStatus;
    deliveryAddress: DeliveryAddress;
    userId: Principal;
    createdAt: Time;
    deliveryOption: DeliveryOption;
    items: Array<OrderItem>;
    paymentIntentId: string;
    totalAmountPaise: bigint;
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
export interface DeliveryAddress {
    street: string;
    city: string;
    name: string;
    phone: string;
    pincode: string;
}
export interface UserProfile {
    name: string;
    email: string;
    phone: string;
}
export enum DeliveryOption {
    express = "express",
    standard = "standard"
}
export enum OrderStatus {
    cancelled = "cancelled",
    pending = "pending",
    outForDelivery = "outForDelivery",
    delivered = "delivered",
    confirmed = "confirmed"
}
export enum ProductCategory {
    sweeteners = "sweeteners",
    leaveningAgents = "leaveningAgents",
    fatsOils = "fatsOils",
    decoratingTools = "decoratingTools",
    bakingEquipment = "bakingEquipment",
    cakeMixes = "cakeMixes",
    floursGrains = "floursGrains",
    flavorExtracts = "flavorExtracts"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(product: Product): Promise<void>;
    addToCart(productId: string, quantity: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearCart(): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteProduct(productId: string): Promise<void>;
    filterProducts(category: ProductCategory | null, searchText: string | null, minPrice: bigint | null, maxPrice: bigint | null): Promise<Array<Product>>;
    getAllOrders(): Promise<Array<Order>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<Array<CartItem>>;
    getOrder(orderId: string): Promise<Order>;
    getProducts(): Promise<Array<Product>>;
    getProductsByCategory(category: ProductCategory): Promise<Array<Product>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserOrders(): Promise<Array<Order>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    isValidPincode(pincode: string): Promise<boolean>;
    placeOrder(deliveryAddress: DeliveryAddress, deliveryOption: DeliveryOption, paymentIntentId: string): Promise<string>;
    removeFromCart(productId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedProducts(): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void>;
    updateProduct(productId: string, product: Product): Promise<void>;
}
