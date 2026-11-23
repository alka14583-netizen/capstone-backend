import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { money, fallbackImg } from "../services/api";

export default function ProductCard({ product }) {
  const out = product.stock === 0;
  return (
    <Link to={`/products/${product._id}`} className="card product-card">
      <div className="img-wrap">
        <img src={product.images?.[0] || fallbackImg(product._id)} alt={product.name} loading="lazy" />
        {out ? <span className="tag danger">Out of stock</span> : product.stock <= product.lowStockThreshold && <span className="tag warn">Only {product.stock} left</span>}
      </div>
      <div className="card-body">
        <small className="muted">{product.category?.name}</small>
        <h3>{product.name}</h3>
        <div className="price-row"><b className="price">{money(product.price)}</b><ArrowUpRight size={17} className="muted" /></div>
      </div>
    </Link>
  );
}
