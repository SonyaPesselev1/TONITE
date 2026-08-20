import { useSyncExternalStore } from "react";
import { inventory } from "./inventory";

/** Re-renders whenever any unit anywhere in the city moves. */
export function useInventoryVersion() {
  return useSyncExternalStore(inventory.subscribe, inventory.getVersion, inventory.getVersion);
}

export function useSizes(productId: string) {
  useInventoryVersion();
  return inventory.sizes(productId);
}

export function useStockTotal(productId: string) {
  useInventoryVersion();
  return inventory.total(productId);
}

export function useFeed() {
  const v = useInventoryVersion();
  return { events: inventory.feed, version: v };
}
