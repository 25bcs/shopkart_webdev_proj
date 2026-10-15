import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, money } from '../services/api';
import Status from '../components/Status';

export default function Orders() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api('/orders' + (id ? '/' + id : '')).then(result => { if (active) setData(result); }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry]);
  if (loading || error) return <Status loading={loading} error={error} retry={() => setRetry(retry + 1)} />;
  const order = data.order;
  if (order) return <><Link to="/orders">Back to orders</Link><h1>{order.paymentStatus === 'PAID' ? 'Order placed' : 'Order details'}</h1><section className="box"><p>Order #{order._id}</p><p>{new Date(order.createdAt).toLocaleString()}</p><p className="badge">{order.status.replaceAll('_', ' ')} · {order.paymentStatus}</p>{order.items.map(item => <div className="order-line" key={item._id}><span>{item.name} × {item.quantity}</span><strong>{money(item.price * item.quantity)}</strong></div>)}<hr /><p>Total: <strong>{money(order.totalAmount)}</strong></p><h2>Shipping address</h2><p>{order.shippingAddress.fullName}<br />{order.shippingAddress.addressLine1}<br />{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />{order.shippingAddress.phone}</p>{order.razorpayPaymentId && <p>Payment ID: {order.razorpayPaymentId}</p>}</section></>;
  return <><h1>Your orders</h1>{!data.orders.length ? <Status empty="You haven't placed an order yet." /> : data.orders.map(order => <article className="box order" key={order._id}><div><h3>Order #{order._id.slice(-8)}</h3><p>{new Date(order.createdAt).toLocaleDateString()} · {order.items.length} products</p><small>{order.status.replaceAll('_', ' ')} · {order.paymentStatus}</small></div><strong>{money(order.totalAmount)}</strong><Link className="button outline" to={'/orders/' + order._id}>View order</Link></article>)}</>;
}
