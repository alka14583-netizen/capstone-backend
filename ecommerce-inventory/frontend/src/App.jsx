import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Products from "./pages/Products.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Orders from "./pages/Orders.jsx";
import SellerDashboard from "./pages/SellerDashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import Analytics from "./pages/Analytics.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<ProtectedRoute roles={["customer"]}><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute roles={["customer"]}><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/seller" element={<ProtectedRoute roles={["seller", "admin"]}><SellerDashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute roles={["seller", "admin"]}><Inventory /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute roles={["seller", "admin"]}><Analytics /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<div className="container section"><h2>Page not found</h2></div>} />
        </Routes>
      </main>
      <footer className="footer">ShopSphere - E-Commerce and Inventory Management System (BCA Capstone Project)</footer>
    </>
  );
}
