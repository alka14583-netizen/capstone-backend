import { useEffect, useState } from "react";
import api, { errMsg, money } from "../services/api";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Simple horizontal bar list made with CSS (no chart library needed)
function Bars({ rows, label, value, format = (v) => v }) {
  const max = Math.max(1, ...rows.map((r) => r[value]));
  return rows.length === 0 ? <p className="muted">No data yet</p> : rows.map((r) => (
    <div className="bar-row" key={r[label]}>
      <span className="bar-label">{r[label]}</span>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${(r[value] / max) * 100}%` }} /></div>
      <b>{format(r[value])}</b>
    </div>
  ));
}

export default function Analytics() {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/reports/sales"), api.get("/reports/best-selling"), api.get("/reports/category-sales"), api.get("/reports/inventory")])
      .then(([s, b, c, i]) => setD({ sales: s.data.data, best: b.data.data, cat: c.data.data, inv: i.data.data }))
      .catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <div className="container section"><div className="alert error">{error}</div></div>;
  if (!d) return <div className="spinner" />;
  const { sales, best, cat, inv } = d;
  const monthly = sales.monthlyRevenue.map((m) => ({ ...m, name: `${MONTHS[m.month - 1]} ${m.year}` }));

  return (
    <div className="container section">
      <h1>Sales analytics</h1>
      <div className="grid grid-4 stats">
        <div className="card stat"><small>Total revenue</small><b>{money(sales.summary.totalRevenue)}</b></div>
        <div className="card stat"><small>Total orders</small><b>{sales.summary.totalOrders}</b></div>
        <div className="card stat"><small>Pending / Completed</small><b>{sales.pendingOrders} / {sales.completedOrders}</b></div>
        <div className="card stat"><small>Low-stock products</small><b>{inv.summary.lowStockCount}</b></div>
      </div>
      <div className="grid grid-2">
        <div className="card pad-lg"><h3>Monthly revenue</h3><Bars rows={monthly} label="name" value="revenue" format={money} /></div>
        <div className="card pad-lg"><h3>Best-selling products</h3><Bars rows={best} label="name" value="unitsSold" format={(v) => `${v} sold`} /></div>
        <div className="card pad-lg"><h3>Category-wise sales</h3><Bars rows={cat} label="category" value="revenue" format={money} /></div>
        <div className="card pad-lg">
          <h3>Inventory summary</h3>
          <div className="row-between"><span>Products</span><b>{inv.summary.totalProducts}</b></div>
          <div className="row-between"><span>Units in stock</span><b>{inv.summary.totalUnits}</b></div>
          <div className="row-between"><span>Inventory value</span><b>{money(inv.summary.inventoryValue)}</b></div>
          <div className="row-between"><span>Out of stock</span><b>{inv.summary.outOfStock}</b></div>
          <h4>Low-stock report</h4>
          {inv.lowStock.length === 0 ? <p className="muted">All products are well stocked</p> : inv.lowStock.map((p) => <div className="row-between" key={p._id}><span>{p.name}</span><span className="pill warn">{p.stock}</span></div>)}
        </div>
      </div>
    </div>
  );
}
