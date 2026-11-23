import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../services/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError(""); setBusy(true);
    try { await login(form.email, form.password); navigate("/"); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="container auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h2>Welcome back</h2><p className="muted">Log in to your account</p>
        {error && <div className="alert error">{error}</div>}
        <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="btn full" disabled={busy}>{busy ? "Logging in..." : "Login"}</button>
        <p className="muted center">New here? <Link to="/register" className="link">Create an account</Link></p>
        <div className="demo-box"><b>Demo accounts</b><br />customer1@shop.com / Customer@123<br />seller1@shop.com / Seller@123<br />admin@shop.com / Admin@123</div>
      </form>
    </div>
  );
}
