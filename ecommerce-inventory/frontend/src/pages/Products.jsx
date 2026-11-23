import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { errMsg } from "../services/api";
import ProductCard from "../components/ProductCard";

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [cats, setCats] = useState([]);
  const [data, setData] = useState({ items: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [search, setSearch] = useState(params.get("q") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const page = params.get("page") || 1;
  useEffect(() => { api.get("/categories").then((r) => setCats(r.data.data)).catch(() => {}); }, []);

  // Re-load products whenever the URL filters change
  useEffect(() => {
    setLoading(true); setError("");
    api.get(`/products?${params.toString()}`)
      .then((r) => setData(r.data.data)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, [params]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  return (
    <div className="container section">
      <h1>Products</h1>
      <form className="filters card" onSubmit={(e) => { e.preventDefault(); update("q", search.trim()); }}>
        <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={params.get("category") || ""} onChange={(e) => update("category", e.target.value)} aria-label="Category">
          <option value="">All categories</option>{cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input type="number" min="0" placeholder="Min ₹" defaultValue={params.get("minPrice") || ""} onBlur={(e) => update("minPrice", e.target.value)} />
        <input type="number" min="0" placeholder="Max ₹" defaultValue={params.get("maxPrice") || ""} onBlur={(e) => update("maxPrice", e.target.value)} />
        <select value={params.get("sort") || "newest"} onChange={(e) => update("sort", e.target.value)} aria-label="Sort">
          <option value="newest">Newest</option><option value="oldest">Oldest</option>
          <option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
        </select>
        <button className="btn">Search</button>
      </form>

      {error && <div className="alert error">{error}</div>}
      {loading ? <div className="spinner" /> : data.items.length === 0 ? <p className="muted pad">No products found.</p> : (
        <>
          <p className="muted">{data.pagination.total} product(s)</p>
          <div className="grid grid-4">{data.items.map((p) => <ProductCard key={p._id} product={p} />)}</div>
          <div className="pager">
            <button className="btn btn-outline btn-sm" disabled={Number(page) <= 1} onClick={() => update("page", Number(page) - 1)}>Previous</button>
            <span>Page {data.pagination.page} of {data.pagination.pages}</span>
            <button className="btn btn-outline btn-sm" disabled={Number(page) >= data.pagination.pages} onClick={() => update("page", Number(page) + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
