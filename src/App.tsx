import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { TabBar } from "./components/Chrome";
import { inventory } from "./lib/inventory";
import BuildLook from "./screens/BuildLook";
import Cart from "./screens/Cart";
import Checkout from "./screens/Checkout";
import Home from "./screens/Home";
import { CategoryScreen, OccasionScreen } from "./screens/Listing";
import Orders from "./screens/Orders";
import ProductScreen from "./screens/ProductScreen";
import Shop from "./screens/Shop";
import Store from "./screens/Store";
import Tracking from "./screens/Tracking";

const NO_TABBAR = ["/checkout"];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    inventory.start();
    return () => inventory.stop();
  }, []);

  return (
    <div className="shell">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/store/:storeId" element={<Store />} />
        <Route path="/category/:categoryId" element={<CategoryScreen />} />
        <Route path="/occasion/:occasionId" element={<OccasionScreen />} />
        <Route path="/product/:productId" element={<ProductScreen />} />
        <Route path="/look" element={<BuildLook />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/order/:orderId" element={<Tracking />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!NO_TABBAR.includes(pathname) && <TabBar />}
    </div>
  );
}
