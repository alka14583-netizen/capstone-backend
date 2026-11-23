import { useEffect, useState } from "react";
import api, { errMsg, money } from "../services/api";

const EMPTY = { name: "", description: "", price: "", stock: "", category: "", image: "", lowStockThreshold: 5 };

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = () => api.get("/products/seller/mine").then((r) => setProducts(r.data.data.items)).catch((e) => setMsg({ type: "error", text: errMsg(e) }));
  useEffect(() => { load(); api.get("/categories").then((r) => setCats(r.data.data)); }, []);

  const submit = async (e) => {
    e.preventDefault(); setMsg({ type: "", text: "" });
    const body = {
      name: form.name, description: form.description, price: Number(form.price), category: form.category,
      lowStockThreshold: Number(form.lowStockThreshold), images: form.image ? [form.image] : [],
    };
    try {
      if (editId) await api.patch(`/products/${editId}`, body);
      else await api.post("/products", { ...body, stock: Number(form.stock) });
      setMsg({ type: "success", text: editId ? "Product updated" : "Product added" });
      setForm(EMPTY); setEditId(null); load();
    } catch (err) { setMsg({ type: "error", text: errMsg(err) }); }
  };

  const edit = (p) => {
    setEditId(p._id);
    setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock, category: p.category?._id || "", image: p.images?.[0] || "", lowStockThreshold: p.lowStockThreshold });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { await api.delete(`/products/${id}`); load(); } catch (err) { setMsg({ type: "error", text: errMsg(err) }); }
  };

  return (
    <div className="container section">
      <h1>Product management</h1>
      <form className="card pad-lg" onSubmit={submit}>
        <h3>{editId ? "Edit product" : "Add new product"}</h3>
        {msg.text && <div className={`alert ${msg.type}`}>{msg.text}</div>}
        <div className="form-grid">
          <label>Name<input required value={form.name} onChange={set("name")} /></label>
          <label>Category<select required value={form.category} onChange={set("category")}><option value="">Select...</option>{cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
          <label>Price (₹)<input type="number" min="0" step="0.01" required value={form.price} onChange={set("price")} /></label>
          <label>Stock {editId && <small>(change in Inventory page)</small>}<input type="number" min="0" required disabled={!!editId} value={form.stock} onChange={set("stock")} /></label>
          <label>Low-stock alert at<input type="number" min="0" value={form.lowStockThreshold} onChange={set("lowStockThreshold")} /></label>
          <label>Image URL<input type="url" placeholder="https://..." value={form.image} onChange={set("image")} /></label>
          <label className="span2">Description<textarea rows="3" value={form.description} onChange={set("description")} /></label>
        </div>
        <div className="actions"><button className="btn">{editId ? "Save changes" : "Add product"}</button>{editId && <button type="button" className="btn btn-outline" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</button>}</div>
      </form>

      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th /></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}><td>{p.name}</td><td>{p.category?.name}</td><td>{money(p.price)}</td>
                <td><span className={p.stock <= p.lowStockThreshold ? "text-warn" : ""}>{p.stock}</span></td>
                <td className="right"><button className="btn btn-outline btn-sm" onClick={() => edit(p)}>Edit</button> <button className="btn btn-outline btn-sm danger-btn" onClick={() => remove(p._id)}>Delete</button></td></tr>
            ))}
            {products.length === 0 && <tr><td colSpan="5" className="muted">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
