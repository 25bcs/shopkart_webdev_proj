import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { api, money } from '../services/api';
import Status from '../components/Status';

async function loadPaymentScript() {
  if (window.Razorpay) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load payment checkout. Try again.'));
    document.head.appendChild(script);
  });
}

export default function Checkout() {
  const { user, cart, subtotal, count, syncing, syncError, refresh } = useShop();
  const [form, setForm] = useState({ fullName: user.fullName, phone: user.phone, addressLine1: '', city: '', state: '', pincode: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault(); setError('');
    if (Object.values(form).some(value => !value.trim())) { setError('All shipping fields are required'); return; }
    setBusy(true);
    try {
      await loadPaymentScript();
      const result = await api('/orders/create-payment-order', 'POST', { shippingAddress: form });
      const checkout = new window.Razorpay({
        key: result.key, amount: result.amount, currency: result.currency, order_id: result.razorpayOrderId,
        name: 'ShopKart', description: 'Test order', theme: { color: '#880d1e' },
        prefill: { name: form.fullName, contact: form.phone, email: user.email },
        modal: { ondismiss: () => { setBusy(false); setError('Payment cancelled. Your cart is saved.'); } },
        handler: async response => {
          try {
            const verified = await api('/orders/verify-payment', 'POST', response);
            await refresh().catch(() => {});
            navigate('/orders/' + verified.order._id);
          } catch (error) { setError(error.message + '. If payment was taken, keep payment ID ' + response.razorpay_payment_id + ' and contact the shop.'); }
          finally { setBusy(false); }
        }
      });
      checkout.on('payment.failed', response => { setBusy(false); setError(response.error?.description || 'Payment failed. Your cart is saved.'); });
      checkout.open();
    } catch (error) { setError(error.message); setBusy(false); }
  }
  if (syncing || syncError || !cart.length) return <Status loading={syncing} error={syncError} empty="Add products to your cart before checkout." retry={() => refresh().catch(() => {})} />;
  return <><h1>Checkout</h1><div className="two-column"><section className="box"><h2>Shipping address</h2><form onSubmit={submit}>{Object.keys(form).map(key => <label key={key}>{({ fullName: 'Full name', phone: 'Phone number', addressLine1: 'Address line', city: 'City', state: 'State', pincode: 'Pincode' })[key]}<input required value={form[key]} name={key} type={key === 'phone' ? 'tel' : 'text'} autoComplete={({ fullName: 'name', phone: 'tel', addressLine1: 'address-line1', city: 'address-level2', state: 'address-level1', pincode: 'postal-code' })[key]} pattern={key === 'phone' ? '[0-9]{10}' : key === 'pincode' ? '[0-9]{6}' : undefined} onChange={event => setForm({ ...form, [key]: event.target.value })} /></label>)}{error && <p className="error" role="alert">{error}</p>}<button disabled={busy}>{busy ? 'Payment in progress...' : 'Pay ' + money(subtotal)}</button><small>Razorpay test mode. Use test payment details.</small></form></section><aside><h2>Order summary</h2>{cart.map(({ product, quantity }) => <p key={product._id}>{product.name} × {quantity}<strong>{money(product.price * quantity)}</strong></p>)}<hr /><p>{count} items <strong>{money(subtotal)}</strong></p><p>Delivery <span>Free</span></p><p>Total <strong>{money(subtotal)}</strong></p></aside></div></>;
}
