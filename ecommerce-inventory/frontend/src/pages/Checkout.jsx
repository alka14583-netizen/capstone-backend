import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { errMsg, money } from "../services/api";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [addr, setAddr] = useState({ fullName: "", phone: "", line1: "", city: "", state: "", postalCode: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setAddr({ ...addr, [k]: e.target.value });

  const placeOrder = async (e) => {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      await api.post("/orders", { shippingAddress: addr }); // only the address is sent; prices come from the server
      await refresh();
      navigate("/orders");
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  if (cart.items.length === 0) return <div className="container section center"><h2>Nothing to checkout</h2><Link to="/products" className="btn">Shop now</Link></div>;

  return (
    <div className="container section cart-layout">
      <form onSubmit={placeOrder} className="card pad-lg">
        <h1>Checkout</h1>
        {error && <div className="alert error">{error}</div>}
        <h3>Delivery address</h3>
        <div className="form-grid">
          <label>Full name<input required value={addr.fullName} onChange={set("fullName")} /></label>
          <label>Phone<input required value={addr.phone} onChange={set("phone")} /></label>
          <label className="span2">Address<input required value={addr.line1} onChange={set("line1")} /></label>
          <label>City<input required value={addr.city} onChange={set("city")} /></label>
          <label>State<input required value={addr.state} onChange={set("state")} /></label>
          <label>Postal code<input required value={addr.postalCode} onChange={set("postalCode")} /></label>
        </div>
        <div className="demo-box"><b>Payment (simulated)</b><br />This is a demo store. No real payment is taken and no card details are needed.</div>
        <button className="btn full" disabled={busy}>{busy ? "Placing order..." : `Place order · ${money(cart.total)}`}</button>
      </form>
      <aside className="card summary">
        <h3>Your items</h3>
        {cart.items.map((i) => <div className="row-between" key={i.productId}><span>{i.name} × {i.quantity}</span><span>{money(i.lineTotal)}</span></div>)}
        <div className="row-between total"><span>Total</span><span>{money(cart.total)}</span></div>
      </aside>
    </div>
  );
}
