import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { errMsg, money, fallbackImg } from "../services/api";

export default function Cart() {
  const { cart, updateQty, removeItem } = useCart();
  const [error, setError] = useState("");
  const run = async (fn) => { setError(""); try { await fn(); } catch (e) { setError(errMsg(e)); } };

  if (cart.items.length === 0) {
    return <div className="container section center"><h2>Your cart is empty</h2><Link to="/products" className="btn">Continue shopping</Link></div>;
  }
  return (
    <div className="container section cart-layout">
      <div>
        <h1>Shopping cart</h1>
        {error && <div className="alert error">{error}</div>}
        {cart.items.map((i) => (
          <div className="card cart-item" key={i.productId}>
            <img src={i.image || fallbackImg(i.productId)} alt={i.name} />
            <div className="grow">
              <h3>{i.name}</h3><p className="muted">{money(i.price)} each</p>
              {!i.available && <small className="text-danger">Only {i.stock} left. Please reduce quantity.</small>}
            </div>
            <div className="qty-ctl">
              <button onClick={() => i.quantity > 1 && run(() => updateQty(i.productId, i.quantity - 1))} aria-label="Decrease">−</button>
              <span>{i.quantity}</span>
              <button onClick={() => run(() => updateQty(i.productId, i.quantity + 1))} aria-label="Increase">+</button>
            </div>
            <b>{money(i.lineTotal)}</b>
            <button className="icon-btn" onClick={() => run(() => removeItem(i.productId))} aria-label="Remove"><Trash2 size={17} /></button>
          </div>
        ))}
      </div>
      <aside className="card summary">
        <h3>Order summary</h3>
        <div className="row-between"><span>Items</span><span>{cart.itemCount}</span></div>
        <div className="row-between"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
        <div className="row-between total"><span>Total</span><span>{money(cart.total)}</span></div>
        <Link to="/checkout" className="btn full">Proceed to checkout</Link>
      </aside>
    </div>
  );
}
