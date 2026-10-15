import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { money } from '../services/api';
import Status from '../components/Status';

export default function Cart() {
  const { cart, count, subtotal, mutate, syncing, syncError, refresh } = useShop();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function change(id, method, quantity) {
    setBusy(true); setError('');
    try { await mutate('/cart/' + id, method, quantity === undefined ? undefined : { quantity }); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <><h1>Your cart</h1>{error && <p className="error" role="alert">{error}</p>}{syncing || syncError || !cart.length ? <Status loading={syncing} error={syncError} empty="Your cart is empty." retry={() => refresh().catch(() => {})} /> : <div className="two-column"><div>{cart.map(({ product, quantity }) => <article className="cart-row" key={product._id}><img src={product.image} alt={product.name} /><div><h3><Link to={'/products/' + product._id}>{product.name}</Link></h3><p>{money(product.price)} each</p><div className="quantity"><button className="outline" aria-label={'Decrease ' + product.name + ' quantity'} disabled={busy || quantity <= 1} onClick={() => change(product._id, 'PATCH', quantity - 1)}>-</button><span>{quantity}</span><button className="outline" aria-label={'Increase ' + product.name + ' quantity'} disabled={busy || quantity >= product.stock} onClick={() => change(product._id, 'PATCH', quantity + 1)}>+</button><button className="text-button" disabled={busy} onClick={() => change(product._id, 'DELETE')}>Remove</button></div>{quantity > product.stock && <p className="error">Only {product.stock} in stock. Reduce quantity or remove this item.</p>}</div><strong>{money(product.price * quantity)}</strong></article>)}</div><aside><h2>Order summary</h2><p>{count} items <strong>{money(subtotal)}</strong></p><p>Delivery <span>Free</span></p><hr /><p>Total <strong>{money(subtotal)}</strong></p><Link className="button" to="/checkout">Continue to checkout</Link></aside></div>}</>;
}
