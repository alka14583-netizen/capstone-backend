import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);
const EMPTY = { items: [], itemCount: 0, subtotal: 0, total: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);

  const refresh = useCallback(async () => {
    if (user?.role !== "customer") return setCart(EMPTY);
    try { setCart((await api.get("/cart")).data.data); } catch (e) { setCart(EMPTY); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Each action calls the backend, then stores the cart the server calculated
  const addToCart = async (productId, quantity = 1) => setCart((await api.post("/cart", { productId, quantity })).data.data);
  const updateQty = async (productId, quantity) => setCart((await api.patch(`/cart/${productId}`, { quantity })).data.data);
  const removeItem = async (productId) => setCart((await api.delete(`/cart/${productId}`)).data.data);

  return <CartContext.Provider value={{ cart, refresh, addToCart, updateQty, removeItem }}>{children}</CartContext.Provider>;
}
