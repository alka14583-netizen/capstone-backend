import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { errMsg, money, fallbackImg } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => setProduct(r.data.data))
      .catch((e) => setMsg({ type: "error", text: errMsg(e) })).finally(() => setLoading(false));
  }, [id]);

  const add = async () => {
    if (!user) return navigate("/login");
    try { await addToCart(id, qty); setMsg({ type: "success", text: "Added to cart!" }); }
    catch (e) { setMsg({ type: "error", text: errMsg(e) }); }
  };

  if (loading) return <div className="spinner" />;
  if (!product) return <div className="container section"><div className="alert error">{msg.text || "Product not found"}</div></div>;

  return (
    <div className="container section details">
      <img className="details-img" src={product.images?.[0] || fallbackImg(product._id)} alt={product.name} />
      <div>
        <small className="muted">{product.category?.name}</small>
        <h1>{product.name}</h1>
        <p className="price big">{money(product.price)}</p>
        <p>{product.description}</p>
        <p className="muted">Sold by <b>{product.seller?.name}</b></p>
        <p className={product.stock === 0 ? "text-danger" : product.stock <= product.lowStockThreshold ? "text-warn" : "text-ok"}>
          {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
        </p>
        {msg.text && <div className={`alert ${msg.type}`}>{msg.text}</div>}
        {(!user || user.role === "customer") && product.stock > 0 && (
          <div className="qty-row">
            <input type="number" min="1" max={product.stock} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} aria-label="Quantity" />
            <button className="btn" onClick={add}>Add to cart</button>
          </div>
        )}
      </div>
    </div>
  );
}
