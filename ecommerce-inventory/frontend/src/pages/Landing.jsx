import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Zap, Bell, Boxes } from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

export default function Landing() {
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/categories"), api.get("/products?limit=4")])
      .then(([c, p]) => { setCats(c.data.data); setProducts(p.data.data.items); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="eyebrow">Trusted marketplace for modern commerce</span>
            <h1>Shop smarter. Sell <span className="grad">without overselling.</span></h1>
            <p>Discover quality products, manage inventory in real time, and enjoy a fast, secure shopping experience.</p>
            <div className="hero-btns"><Link to="/products" className="btn">Browse products</Link><Link to="/register" className="btn btn-outline">Become a seller</Link></div>
          </div>
          <div className="hero-card">
            <div className="stat-mini"><Boxes size={22} /><div><b>Live stock</b><small>Atomic updates, zero overselling</small></div></div>
            <div className="stat-mini"><Bell size={22} /><div><b>Instant alerts</b><small>Orders and low-stock in real time</small></div></div>
            <div className="stat-mini"><ShieldCheck size={22} /><div><b>Secure by design</b><small>JWT, bcrypt, role-based access</small></div></div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="row-between"><h2>Explore categories</h2><span className="muted">Curated for every need</span></div>
        <div className="chips">{cats.map((c) => <Link key={c._id} to={`/products?category=${c._id}`} className="chip">{c.name}</Link>)}</div>
      </section>

      <section className="container section">
        <div className="row-between"><h2>Fresh arrivals</h2><Link to="/products" className="link">View collection →</Link></div>
        {loading ? <div className="spinner" /> : products.length === 0 ? <p className="muted">No products yet. Run the seed script.</p> :
          <div className="grid grid-4">{products.map((p) => <ProductCard key={p._id} product={p} />)}</div>}
      </section>

      <section className="container section features">
        {[[Zap, "Fast checkout", "Prices and totals are calculated on the server."], [ShieldCheck, "Safe payments", "Payment is simulated. No card details are collected."], [Bell, "Stay informed", "Real-time order status notifications."]].map(([Icon, t, d]) => (
          <div className="card feature" key={t}><Icon size={26} /><h3>{t}</h3><p className="muted">{d}</p></div>
        ))}
      </section>
    </>
  );
}
