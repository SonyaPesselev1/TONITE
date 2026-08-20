import { STORES_BY_ID } from "../data/stores";
import { listOf } from "./format";
import type { Order } from "../state/OrdersContext";

export type StageId =
  | "confirmed"
  | "picking"
  | "packed"
  | "collected"
  | "enroute"
  | "arriving"
  | "delivered";

export interface StageDef {
  id: StageId;
  title: string;
  /** Fraction of the journey at which this stage begins. */
  at: number;
}

export const STAGES: StageDef[] = [
  { id: "confirmed", title: "Order confirmed", at: 0 },
  { id: "picking", title: "Pulling your pieces", at: 0.08 },
  { id: "packed", title: "Steamed & wrapped", at: 0.3 },
  { id: "collected", title: "Courier collected", at: 0.46 },
  { id: "enroute", title: "On the way to you", at: 0.56 },
  { id: "arriving", title: "Arriving now", at: 0.9 },
  { id: "delivered", title: "Delivered", at: 1 },
];

export interface Progress {
  stage: StageDef;
  index: number;
  /** 0–1 across the whole journey. */
  fraction: number;
  /** Minutes until the middle of the promised window; can go negative. */
  minutesLeft: number;
  arriveAt: Date;
  delivered: boolean;
  detail: string;
}

export function progressFor(order: Order, now = Date.now()): Progress {
  const virtualNow = now + (order.fastForwardMs ?? 0);
  const target = (order.etaFrom + order.etaTo) / 2;
  const span = Math.max(60_000, target - order.placedAt);
  const fraction = Math.min(1, Math.max(0, (virtualNow - order.placedAt) / span));
  let index = 0;
  STAGES.forEach((s, i) => {
    if (fraction >= s.at) index = i;
  });
  const stage = STAGES[index];
  const minutesLeft = Math.round((target - virtualNow) / 60_000);
  const storeNames = listOf(
    order.storeIds.map((id) => STORES_BY_ID[id]?.name ?? "the boutique"),
  );

  const detail: Record<StageId, string> = {
    confirmed: `Sent to ${storeNames}. A stylist is picking it up now.`,
    picking: `A stylist at ${storeNames} is pulling your sizes off the floor.`,
    packed: "Steamed, folded in tissue and boxed with your wear notes.",
    collected: `${order.courier.name} has your order and is leaving ${order.storeIds.length > 1 ? "the last stop" : storeNames}.`,
    enroute: `${order.courier.name} is ${order.courier.vehicle} across town.`,
    arriving: `${order.courier.name} is on your block. Meet them at the door.`,
    delivered: `Handed to you at ${new Date(order.deliveredAt ?? target).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`,
  };

  return {
    stage,
    index,
    fraction,
    minutesLeft,
    arriveAt: new Date(target - (order.fastForwardMs ?? 0)),
    delivered: fraction >= 1,
    detail: detail[stage.id],
  };
}

const COURIERS = [
  { name: "Ines", vehicle: "on an e-bike" },
  { name: "Marcus", vehicle: "in a black Prius" },
  { name: "Dede", vehicle: "on a scooter" },
  { name: "Rafa", vehicle: "on an e-bike" },
  { name: "Yuki", vehicle: "in a silver hatchback" },
  { name: "Tomas", vehicle: "on foot and rail" },
];

export function assignCourier(seed: number) {
  return COURIERS[seed % COURIERS.length];
}

/** Short human code shown on the doorstep and in the order list. */
export function orderCode(seed: number) {
  const letters = "ACDEFHKLMNPRTVWXY";
  const a = letters[seed % letters.length];
  const b = letters[(seed >> 5) % letters.length];
  return `${a}${b}-${String(seed % 9000 + 1000)}`;
}
