import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { money } from '../services/api';

export function ProductActions({ product }) {
  const { wishlist, cart, mutate, syncing, syncError } = useShop();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saved = wishlist.some(item => item._id === product._id);
  const inCart = cart.some(item => item.product._id === product._id);
  async function act(path, method) {
    setBusy(true); setError('');
    try { await mutate(path, method); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <><div className="actions"><button className="outline" disabled={busy || syncing || !!syncError} onClick={() => act('/wishlist/' + product._id, saved ? 'DELETE' : 'POST')}>{busy ? 'Please wait...' : saved ? 'Unsave' : 'Save'}</button>{inCart ? <Link className="button" to="/cart">View cart</Link> : <button disabled={busy || syncing || !!syncError || !product.stock} onClick={() => act('/cart/' + product._id, 'POST')}>{product.stock ? 'Add to cart' : 'Out of stock'}</button>}</div>{error && <p className="error" role="alert">{error}</p>}</>;
}

export default function ProductCard({ product }) {
  return <article className="product"><Link className="product-image" to={'/products/' + product._id}><img src={product.image} alt={product.name} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/placeholder.svg'; }} /></Link><div className="product-body"><small>{product.category}</small><h3><Link to={'/products/' + product._id}>{product.name}</Link></h3><p className="price">{money(product.price)}</p><ProductActions product={product} /></div></article>;
}
