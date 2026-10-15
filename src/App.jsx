import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ShopProvider, useShop } from './context/ShopContext';
import Navbar from './components/Navbar';
import Status from './components/Status';
import Auth from './pages/Auth';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';

function Protected() {
  const { user, loading, error, checkSession } = useShop();
  if (loading || error) return <Status loading={loading} error={error} retry={checkSession} />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function Profile() {
  const { user } = useShop();
  return <section className="box profile"><h1>Hello, {user.fullName}</h1><p>Email: {user.email}</p><p>Phone: {user.phone}</p></section>;
}

function SyncNotice() {
  const { user, syncError, refresh } = useShop();
  return user && syncError ? <div className="notice" role="alert">Could not load your cart and wishlist. {syncError} <button onClick={() => refresh().catch(() => {})}>Retry</button></div> : null;
}

export default function App() {
  return <ShopProvider><Navbar /><main><SyncNotice /><Routes><Route path="/login" element={<Auth key="login" />} /><Route path="/register" element={<Auth register key="register" />} /><Route element={<Protected />}><Route path="/home" element={<Home />} /><Route path="/products" element={<Home />} /><Route path="/products/:id" element={<ProductDetails />} /><Route path="/wishlist" element={<Wishlist />} /><Route path="/cart" element={<Cart />} /><Route path="/checkout" element={<Checkout />} /><Route path="/orders" element={<Orders />} /><Route path="/orders/:id" element={<Orders />} /><Route path="/profile" element={<Profile />} /></Route><Route path="/" element={<Navigate to="/home" replace />} /><Route path="*" element={<section className="notice"><h1>Page not found</h1><a href="/home">Back to shop</a></section>} /></Routes></main><footer>ShopKart · A simple place to shop.</footer></ShopProvider>;
}
