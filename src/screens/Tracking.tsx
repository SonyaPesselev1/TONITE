import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { PRODUCTS_BY_ID } from "../data/catalog";
import { STORES_BY_ID } from "../data/stores";
import { clockTime, initials, listOf, money2, phone, timeWindow } from "../lib/format";
import { progressFor, STAGES } from "../lib/tracking";
import { useTicker } from "../lib/useTicker";
import { GarmentPlate } from "../components/GarmentPlate";
import { RouteMap } from "../components/RouteMap";
import { TopBar, Toast } from "../components/Chrome";
import { IconCheck, IconPin } from "../components/icons";
import { useOrders } from "../state/OrdersContext";

export default function Tracking() {
  const { orderId = "" } = useParams();
  const { byId, fastForward } = useOrders();
  const now = useTicker(1000);
  const [toast, setToast] = useState<string | null>(null);
  const order = byId(orderId);

  if (!order) return <Navigate to="/orders" replace />;

  const p = progressFor(order, now);
  const stores = order.storeIds.map((id) => STORES_BY_ID[id]).filter(Boolean);
  const stageTime = (index: number) => {
    const span = (order.etaFrom + order.etaTo) / 2 - order.placedAt;
    return new Date(order.placedAt + span * STAGES[index].at);
  };

  return (
    <div className="screen tracking">
      <TopBar title={`Order ${order.code}`} />

      <header className="track-hero">
        <p className="eyebrow track-hero-kicker">
          {p.delivered ? "Delivered" : `Arriving ${timeWindow(new Date(order.etaFrom), new Date(order.etaTo))}`}
        </p>
        <h1 className="display d1">
          {p.delivered ? (
            <>
              At your
              <br />
              <span className="italic">door.</span>
            </>
          ) : p.minutesLeft > 0 ? (
            <>
              <span className="num">{p.minutesLeft}</span> min
              <br />
              <span className="italic">away.</span>
            </>
          ) : (
            <>
              Any
              <br />
              <span className="italic">moment.</span>
            </>
          )}
        </h1>
        <p className="track-hero-detail">{p.detail}</p>

        <RouteMap fraction={p.fraction} label={p.stage.title} />

        <div className="track-progress">
          <div className="track-progress-fill" style={{ width: `${Math.round(p.fraction * 100)}%` }} />
        </div>
        <div className="track-stage-line">
          <span className="label">{p.stage.title}</span>
          <span className="label track-stage-count">
            {p.index + 1}/{STAGES.length}
          </span>
        </div>
      </header>

      {!p.delivered && (
        <section className="pad courier-card">
          <span className="courier-avatar display d4">{initials(order.courier.name)}</span>
          <div className="courier-body">
            <p className="label">{order.courier.name}</p>
            <p className="meta">
              Your courier · {order.courier.vehicle} · {order.speedName}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setToast("Messaging is not wired up in this prototype.")}>
            Message
          </button>
        </section>
      )}

      <section className="pad">
        <p className="label section-label">Progress</p>
        <ol className="timeline">
          {STAGES.map((s, i) => (
            <li key={s.id} className="timeline-row" data-state={i < p.index ? "done" : i === p.index ? "now" : "next"}>
              <span className="timeline-mark">{i < p.index ? <IconCheck size={12} /> : <i />}</span>
              <span className="timeline-body">
                <span className="timeline-title">{s.title}</span>
                <span className="meta">
                  {i <= p.index ? clockTime(stageTime(i)) : `est. ${clockTime(stageTime(i))}`}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="pad">
        <p className="label section-label">In this delivery</p>
        <div className="track-items">
          {order.lines.map((line) => {
            const product = PRODUCTS_BY_ID[line.productId];
            if (!product) return null;
            const picked = p.index >= 2;
            return (
              <Link key={`${line.productId}-${line.size}`} to={`/product/${product.id}`} className="track-item">
                <span className="track-item-plate" data-picked={picked || undefined}>
                  <GarmentPlate category={product.category} colorway={product.colorway} ratio="1 / 1" />
                </span>
                <span className="track-item-body">
                  <span className="eyebrow">{STORES_BY_ID[product.storeId]?.name}</span>
                  <span className="p-name">{product.name}</span>
                  <span className="meta">
                    Size {line.size}
                    {line.qty > 1 ? ` × ${line.qty}` : ""} · {money2(line.price * line.qty)}
                  </span>
                </span>
                <span className="track-item-state label">
                  {picked ? "Packed" : p.index >= 1 ? "Pulling" : "Queued"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="pad">
        <p className="label section-label">Dropping at</p>
        <p className="track-address">
          <IconPin size={14} /> {order.dropoff.address}
          {order.dropoff.apt ? `, ${order.dropoff.apt}` : ""}
          <br />
          <span className="meta">
            {order.dropoff.city} {order.dropoff.zip} · {order.dropoff.name} · {phone(order.dropoff.phone)}
          </span>
          {order.dropoff.note && <span className="meta track-address-note">“{order.dropoff.note}”</span>}
        </p>
        <p className="meta track-from">
          Pulled from {listOf(stores.map((s) => `${s.name} (${s.neighborhood})`))}.
        </p>
      </section>

      <section className="pad track-totals">
        <div className="total-row">
          <span className="meta">Subtotal</span>
          <span className="price">{money2(order.totals.subtotal)}</span>
        </div>
        <div className="total-row">
          <span className="meta">{order.speedName} courier</span>
          <span className="price">{money2(order.totals.delivery)}</span>
        </div>
        <div className="total-row">
          <span className="meta">Tax</span>
          <span className="price">{money2(order.totals.tax)}</span>
        </div>
        <div className="rule" />
        <div className="total-row" data-strong>
          <span className="label">Paid · {order.payment.brand} ····{order.payment.last4}</span>
          <span className="display d4">{money2(order.totals.total)}</span>
        </div>
      </section>

      <div className="pad track-demo">
        <span className="meta">Prototype control — the journey runs in real time.</span>
        <button className="btn btn-ghost btn-sm" onClick={() => fastForward(order.id, 10 * 60_000)}>
          Skip ahead 10 min
        </button>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
