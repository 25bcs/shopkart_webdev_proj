import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';

export default function Navbar() {
  const { user, setUser, count, wishlist } = useShop();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try { await api('/customers/logout', 'POST'); setUser(null); navigate('/login'); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <><header><div className="nav-wrap"><NavLink className="brand" to="/home">ShopKart<span>.</span></NavLink>{user ? <><nav aria-label="Main navigation"><NavLink to="/home">Shop</NavLink><NavLink to="/wishlist">Wishlist ({wishlist.length})</NavLink><NavLink to="/cart">Cart ({count})</NavLink><NavLink to="/orders">Orders</NavLink><NavLink to="/profile">Profile</NavLink></nav><button className="outline" disabled={busy} onClick={logout}>{busy ? 'Logging out...' : 'Logout'}</button></> : <nav><NavLink to="/login">Login</NavLink><NavLink to="/register">Register</NavLink></nav>}</div></header>{error && <p className="error" role="alert">{error}</p>}</>;
}
