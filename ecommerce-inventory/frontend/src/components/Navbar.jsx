import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, ShoppingCart, Bell, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/SocketContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { notifications, unread, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const handleLogout = async () => { await logout(); close(); navigate("/"); };
  const cls = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="logo" onClick={close}><span className="logo-icon"><ShoppingBag size={20} /></span>Shop<b>Sphere</b></Link>

        <nav className={`nav-links ${open ? "open" : ""}`} aria-label="Main navigation">
          <NavLink to="/products" className={cls} onClick={close}>Products</NavLink>
          {user && <NavLink to="/orders" className={cls} onClick={close}>Orders</NavLink>}
          {user && user.role !== "customer" && <>
            <NavLink to="/seller" className={cls} onClick={close}>My Products</NavLink>
            <NavLink to="/inventory" className={cls} onClick={close}>Inventory</NavLink>
            <NavLink to="/analytics" className={cls} onClick={close}>Analytics</NavLink>
          </>}
          {user?.role === "admin" && <NavLink to="/admin" className={cls} onClick={close}>Admin</NavLink>}
        </nav>

        <div className="nav-actions">
          {user?.role === "customer" && (
            <Link to="/cart" className="icon-btn" aria-label="Cart"><ShoppingCart size={19} />{cart.itemCount > 0 && <span className="badge">{cart.itemCount}</span>}</Link>
          )}
          {user && (
            <div className="bell-wrap">
              <button className="icon-btn" aria-label="Notifications" onClick={() => setBell(!bell)}>
                <Bell size={19} />{unread > 0 && <span className="badge">{unread}</span>}
              </button>
              {bell && (
                <div className="dropdown">
                  <div className="dropdown-head"><b>Notifications</b>{unread > 0 && <button className="link-btn" onClick={markAllRead}>Mark all read</button>}</div>
                  {notifications.length === 0 && <p className="muted pad">No notifications yet</p>}
                  {notifications.slice(0, 8).map((n) => (
                    <div key={n._id} className={`notif ${n.isRead ? "" : "unread"}`}>{n.message}<small>{new Date(n.createdAt).toLocaleString()}</small></div>
                  ))}
                </div>
              )}
            </div>
          )}
          {user ? (
            <>
              <span className="user-chip">{user.name.split(" ")[0]} <em>{user.role}</em></span>
              <button className="icon-btn" aria-label="Logout" onClick={handleLogout}><LogOut size={18} /></button>
            </>
          ) : (
            <><Link to="/login" className="btn btn-outline btn-sm">Login</Link><Link to="/register" className="btn btn-sm hide-sm">Sign up</Link></>
          )}
          <button className="icon-btn menu-btn" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
    </header>
  );
}
