import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const ShopContext = createContext();
export const useShop = () => useContext(ShopContext);

export function ShopProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [syncError, setSyncError] = useState('');
  const [syncing, setSyncing] = useState(false);

  async function refresh() {
    setSyncing(true);
    setSyncError('');
    try {
      const [cartData, wishlistData] = await Promise.all([api('/cart'), api('/wishlist')]);
      setCart(cartData.cart);
      setWishlist(wishlistData.wishlist);
    } catch (error) { setSyncError(error.message); throw error; }
    finally { setSyncing(false); }
  }

  async function checkSession() {
    setLoading(true);
    setError('');
    try { setUser(await api('/customers/me')); }
    catch (error) { if (error.status !== 401) setError(error.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { checkSession(); }, []);
  useEffect(() => {
    if (user) refresh().catch(() => {});
    else { setCart([]); setWishlist([]); }
  }, [user]);

  async function mutate(path, method, body) {
    await api(path, method, body);
    await refresh();
  }

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  return <ShopContext.Provider value={{ user, setUser, loading, error, checkSession, cart, wishlist, count, subtotal, refresh, mutate, syncError, syncing }}>{children}</ShopContext.Provider>;
}
