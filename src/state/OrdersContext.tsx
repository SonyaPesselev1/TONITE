import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { loadRaw, save } from "../lib/persist";
import { assignCourier, orderCode } from "../lib/tracking";

export interface OrderLine {
  productId: string;
  size: string;
  qty: number;
  /** Price at the moment of purchase — the rail can change afterwards. */
  price: number;
}

export interface Order {
  id: string;
  code: string;
  placedAt: number;
  lines: OrderLine[];
  storeIds: string[];
  speedId: string;
  speedName: string;
  etaFrom: number;
  etaTo: number;
  deliveredAt?: number;
  courier: { name: string; vehicle: string };
  dropoff: {
    name: string;
    phone: string;
    address: string;
    apt: string;
    city: string;
    zip: string;
    note: string;
  };
  payment: { brand: string; last4: string };
  totals: { subtotal: number; delivery: number; tax: number; total: number };
  /** Prototype affordance: virtual minutes added to the journey clock. */
  fastForwardMs: number;
}

const KEY = "tonite.orders.v1";

interface Ctx {
  orders: Order[];
  latest: Order | null;
  byId: (id: string) => Order | undefined;
  place: (draft: Omit<Order, "id" | "code" | "courier" | "fastForwardMs">) => Order;
  fastForward: (id: string, ms: number) => void;
}

const OrdersCtx = createContext<Ctx | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => loadRaw<Order[]>(KEY, []));

  useEffect(() => {
    save(KEY, orders);
  }, [orders]);

  const place = useCallback<Ctx["place"]>((draft) => {
    const seed = Math.floor(Math.random() * 100000);
    const order: Order = {
      ...draft,
      id: `TNT-${Date.now().toString(36).toUpperCase()}`,
      code: orderCode(seed),
      courier: assignCourier(seed),
      fastForwardMs: 0,
    };
    setOrders((current) => [order, ...current]);
    return order;
  }, []);

  const fastForward = useCallback<Ctx["fastForward"]>((id, ms) => {
    setOrders((current) =>
      current.map((o) => (o.id === id ? { ...o, fastForwardMs: o.fastForwardMs + ms } : o)),
    );
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      orders,
      latest: orders[0] ?? null,
      byId: (id: string) => orders.find((o) => o.id === id),
      place,
      fastForward,
    }),
    [orders, place, fastForward],
  );

  return <OrdersCtx.Provider value={value}>{children}</OrdersCtx.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersCtx);
  if (!ctx) throw new Error("useOrders must be used inside OrdersProvider");
  return ctx;
}
