import { useEffect, useState } from "react";
import api, { errMsg, money } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/SocketContext";

// Same rules as the backend (the backend is the one that really enforces them)
const NEXT = { Pending: ["Confirmed"], Confirmed: ["Processing"], Processing: ["Shipped"], Shipped: ["Delivered"], Delivered: [], Cancelled: [] };
const STEPS = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];

export default function Orders() {
  const { user } = useAuth();
  const { notifications } = useNotifications(); // when a new notification arrives we reload the list
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => api.get("/orders?limit=30").then((r) => setOrders(r.data.data.items)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  useEffect(() => { load(); }, [notifications.length]);

  const act = async (fn) => { setError(""); try { await fn(); await load(); } catch (e) { setError(errMsg(e)); } };
  const setStatus = (id, status) => act(() => api.patch(`/orders/${id}/status`, { status }));
  const cancel = (id) => window.confirm("Cancel this order? Stock will be restored.") && act(() => api.post(`/orders/${id}/cancel`));

  if (loading) return <div className="spinner" />;
  return (
    <div className="container section">
      <h1>{user.role === "customer" ? "My orders" : "Orders"}</h1>
      {error && <div className="alert error">{error}</div>}
      {orders.length === 0 && <p className="muted">No orders yet.</p>}
      {orders.map((o) => (
        <div className="card order" key={o._id}>
          <div className="row-between wrap">
            <div><b>{o.orderNumber}</b><br /><small className="muted">{new Date(o.createdAt).toLocaleString()}{user.role !== "customer" && ` · ${o.customer?.name}`}</small></div>
            <span className={`status ${o.status.toLowerCase()}`}>{o.status}</span>
          </div>
          {o.status !== "Cancelled" && (
            <div className="steps">{STEPS.map((s, i) => <span key={s} className={i <= STEPS.indexOf(o.status) ? "step done" : "step"}>{s}</span>)}</div>
          )}
          <table className="table"><tbody>
            {o.items.map((i) => <tr key={i._id}><td>{i.name}</td><td>{i.quantity} × {money(i.price)}</td><td className="right">{money(i.lineTotal)}</td></tr>)}
          </tbody></table>
          <div className="row-between wrap">
            <small className="muted">Ship to: {o.shippingAddress.line1}, {o.shippingAddress.city} · Payment: {o.paymentStatus === "simulated_paid" ? "Simulated - Paid (demo)" : "Simulated - Refunded (demo)"}</small>
            <b>Total {money(o.totalAmount)}</b>
          </div>
          <div className="actions">
            {user.role !== "customer" && NEXT[o.status].map((s) => <button key={s} className="btn btn-sm" onClick={() => setStatus(o._id, s)}>Mark {s}</button>)}
            {["Pending", "Confirmed"].includes(o.status) && <button className="btn btn-outline btn-sm danger-btn" onClick={() => cancel(o._id)}>Cancel order</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
