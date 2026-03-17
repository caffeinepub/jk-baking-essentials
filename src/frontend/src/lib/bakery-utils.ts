import type { OrderStatus, ProductCategory } from "../backend.d";

export function formatINR(paise: bigint): string {
  const rupees = Number(paise) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export const CATEGORY_LABELS: Record<string, string> = {
  floursGrains: "Flours & Grains",
  sweeteners: "Sweeteners",
  fatsOils: "Fats & Oils",
  leaveningAgents: "Leavening Agents",
  flavorExtracts: "Flavor Extracts",
  cakeMixes: "Cake Mixes",
  decoratingTools: "Decorating Tools",
  bakingEquipment: "Baking Equipment",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  outForDelivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  outForDelivery: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

// Type aliases for backward compatibility
export type { OrderStatus, ProductCategory };
