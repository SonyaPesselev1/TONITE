export const money = (cents: number) =>
  `$${cents.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const money2 = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const clockTime = (d: Date) =>
  d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .replace(" AM", " AM")
    .replace(" PM", " PM");

/** "7:10 – 7:40 PM" — drops the meridiem from the first half when it matches. */
export function timeWindow(from: Date, to: Date) {
  const a = clockTime(from);
  const b = clockTime(to);
  const [ta, ma] = a.split(" ");
  const [, mb] = b.split(" ");
  return ma === mb ? `${ta} – ${b}` : `${a} – ${b}`;
}

export const minutesLabel = (m: number) =>
  m < 60 ? `${Math.max(1, Math.round(m))} min` : `${(m / 60).toFixed(1).replace(/\.0$/, "")} hr`;

export function countdown(msLeft: number) {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

export const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** "Nord", "Nord and Lune", "Nord, Lune and Corso" */
export function listOf(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function phone(value: string) {
  const d = value.replace(/\D/g, "");
  if (d.length !== 10) return value;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6)}`;
}
