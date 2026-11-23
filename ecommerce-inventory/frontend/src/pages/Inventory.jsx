import { Fragment, useEffect, useState } from "react";
import api, { errMsg } from "../services/api";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [edits, setEdits] = useState({});
  const [history, setHistory] = useState({ id: null, rows: [] });
  const [msg, setMsg] = useState({ type: "", text: "" });

  const load = () => api.get("/inventory").then((r) => setItems(r.data.data)).catch((e) => setMsg({ type: "error", text: errMsg(e) }));
  useEffect(() => { load(); }, []);

  const save = async (p) => {
    try {
      await api.patch(`/inventory/${p.id}`, { stock: Number(edits[p.id]) });
      setMsg({ type: "success", text: `Stock updated for ${p.name}` });
      setEdits({ ...edits, [p.id]: undefined }); load();
    } catch (e) { setMsg({ type: "error", text: errMsg(e) }); }
  };
  const showHistory = async (id) => {
    if (history.id === id) return setHistory({ id: null, rows: [] });
    setHistory({ id, rows: (await api.get(`/inventory/history/${id}`)).data.data });
  };
  const low = items.filter((i) => i.lowStock);

  return (
    <div className="container section">
      <h1>Inventory</h1>
      {msg.text && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      {low.length > 0 && <div className="alert warn">⚠ {low.length} product(s) are low on stock: {low.map((i) => `${i.name} (${i.stock})`).join(", ")}</div>}
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Product</th><th>Seller</th><th>Stock</th><th>Alert at</th><th>Set stock</th><th /></tr></thead>
          <tbody>
            {items.map((p) => (
              <Fragment key={p.id}>
                <tr>
                  <td>{p.name}</td><td>{p.seller?.name}</td>
                  <td><span className={`pill ${p.stock === 0 ? "danger" : p.lowStock ? "warn" : "ok"}`}>{p.stock}</span></td>
                  <td>{p.lowStockThreshold}</td>
                  <td><input className="mini" type="number" min="0" value={edits[p.id] ?? ""} placeholder={p.stock} onChange={(e) => setEdits({ ...edits, [p.id]: e.target.value })} /></td>
                  <td className="right">
                    <button className="btn btn-sm" disabled={edits[p.id] === undefined || edits[p.id] === ""} onClick={() => save(p)}>Save</button>{" "}
                    <button className="btn btn-outline btn-sm" onClick={() => showHistory(p.id)}>History</button>
                  </td>
                </tr>
                {history.id === p.id && (
                  <tr><td colSpan="6" className="history">
                    {history.rows.map((h) => <div key={h._id}><b>{h.type}</b> {h.quantityChange > 0 ? "+" : ""}{h.quantityChange} ({h.stockBefore} → {h.stockAfter}) · {new Date(h.createdAt).toLocaleString()}</div>)}
                  </td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
