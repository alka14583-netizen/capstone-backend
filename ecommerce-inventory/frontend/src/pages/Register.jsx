import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../services/api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError(""); setBusy(true);
    try { await register(form); navigate("/"); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="container auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h2>Create your account</h2>
        {error && <div className="alert error">{error}</div>}
        <label>Full name<input required minLength={2} value={form.name} onChange={set("name")} /></label>
        <label>Email<input type="email" required value={form.email} onChange={set("email")} /></label>
        <label>Password (min 6 characters)<input type="password" required minLength={6} value={form.password} onChange={set("password")} /></label>
        <label>I want to<select value={form.role} onChange={set("role")}><option value="customer">Buy products (Customer)</option><option value="seller">Sell products (Seller)</option></select></label>
        <button className="btn full" disabled={busy}>{busy ? "Creating..." : "Sign up"}</button>
        <p className="muted center">Already registered? <Link to="/login" className="link">Login</Link></p>
      </form>
    </div>
  );
}
