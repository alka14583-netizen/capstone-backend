import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg, money } from "../services/api";

export default function AdminDashboard() {
  const [cats, setCats] = useState([]);
  const [sales, setSales] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const load = () => api.get("/categories").then((r) => setCats(r.data.data));
  useEffect(() => { load(); api.get("/reports/sales").then((r) => setSales(r.data.data)).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault(); setMsg({ type: "", text: "" });
    try {
      if (editId) await api.patch(`/categories/${editId}`, form); else await api.post("/categories", form);
      setForm({ name: "", description: "" }); setEditId(null); setMsg({ type: "success", text: "Category saved" }); load();
    } catch (err) { setMsg({ type: "error", text: errMsg(err) }); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try { await api.delete(`/categories/${id}`); load(); } catch (err) { setMsg({ type: "error", text: errMsg(err) }); }
  };

  return (
    <div className="container section">
      <h1>Admin dashboard</h1>
      {sales && (
        <div className="grid grid-4 stats">
          <div className="card stat"><small>Total revenue</small><b>{money(sales.summary.totalRevenue)}</b></div>
          <div className="card stat"><small>Total orders</small><b>{sales.summary.totalOrders}</b></div>
          <div className="card stat"><small>Pending orders</small><b>{sales.pendingOrders}</b></div>
          <Link to="/analytics" className="card stat link-card"><small>Full reports</small><b>Open →</b></Link>
        </div>
      )}
      <form className="card pad-lg" onSubmit={submit}>
        <h3>{editId ? "Edit category" : "Add category"}</h3>
        {msg.text && <div className={`alert ${msg.type}`}>{msg.text}</div>}
        <div className="form-grid">
          <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Description<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        </div>
        <div className="actions"><button className="btn">{editId ? "Save" : "Add"}</button>{editId && <button type="button" className="btn btn-outline" onClick={() => { setEditId(null); setForm({ name: "", description: "" }); }}>Cancel</button>}</div>
      </form>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Category</th><th>Description</th><th /></tr></thead>
          <tbody>{cats.map((c) => (
            <tr key={c._id}><td>{c.name}</td><td className="muted">{c.description}</td>
              <td className="right"><button className="btn btn-outline btn-sm" onClick={() => { setEditId(c._id); setForm({ name: c.name, description: c.description || "" }); }}>Edit</button> <button className="btn btn-outline btn-sm danger-btn" onClick={() => remove(c._id)}>Delete</button></td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
