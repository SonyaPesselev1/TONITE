import { Link } from "react-router-dom";
import { PRODUCTS_BY_ID } from "../data/catalog";
import { clockTime, money2 } from "../lib/format";
import { progressFor } from "../lib/tracking";
import { useTicker } from "../lib/useTicker";
import { GarmentPlate } from "../components/GarmentPlate";
import { TopBar } from "../components/Chrome";
import { IconChevron } from "../components/icons";
import { useOrders } from "../state/OrdersContext";

export default function Orders() {
  const { orders } = useOrders();
  const now = useTicker(5000);

  if (!orders.length) {
    return (
      <div className="screen">
        <TopBar title="Orders" back={false} right={<span />} />
        <div className="pad empty-block">
          <h1 className="display d2">
            No deliveries
            <br />
            <span className="italic">in flight.</span>
          </h1>
          <p className="meta">
            Once you order, this is where you watch a stylist pull your pieces and a courier cross
            town with them.
          </p>
          <Link to="/look" className="btn btn-primary btn-block">
            Build my look
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar title="Orders" back={false} right={<span />} />
      <header className="pad shop-head">
        <h1 className="display d2">Your deliveries</h1>
      </header>

      <div className="list pad">
        {orders.map((order) => {
          const p = progressFor(order, now);
          return (
            <Link key={order.id} to={`/order/${order.id}`} className="order-row">
              <div className="order-row-plates">
                {order.lines.slice(0, 3).map((l) => {
                  const product = PRODUCTS_BY_ID[l.productId];
                  return product ? (
                    <span key={`${l.productId}-${l.size}`} className="order-plate">
                      <GarmentPlate
                        category={product.category}
                        colorway={product.colorway}
                        ratio="1 / 1"
                      />
                    </span>
                  ) : null;
                })}
                {order.lines.length > 3 && (
                  <span className="order-plate order-plate-more num">+{order.lines.length - 3}</span>
                )}
              </div>
              <div className="order-row-body">
                <p className="eyebrow">
                  {order.code} · {new Date(order.placedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <p className="display d4">{p.delivered ? "Delivered" : p.stage.title}</p>
                <p className="meta">
                  {p.delivered
                    ? `${order.lines.length} pieces · ${money2(order.totals.total)}`
                    : `Arriving ${clockTime(new Date(order.etaFrom))} – ${clockTime(new Date(order.etaTo))}`}
                </p>
                {!p.delivered && (
                  <div className="order-progress">
                    <div style={{ width: `${Math.round(p.fraction * 100)}%` }} />
                  </div>
                )}
              </div>
              <IconChevron size={16} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
