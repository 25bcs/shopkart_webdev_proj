import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, money } from '../services/api';
import { ProductActions } from '../components/ProductCard';
import Status from '../components/Status';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api('/products/' + id).then(data => { if (active) setProduct(data.product); }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry]);
  if (loading || error) return <Status loading={loading} error={error} retry={() => setRetry(retry + 1)} />;
  return <><Link to="/home">Back to products</Link><section className="details"><img src={product.image} alt={product.name} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/placeholder.svg'; }} /><div><small>{product.category}</small><h1>{product.name}</h1><p>{product.description}</p><p className="price">{money(product.price)}</p><p>{product.stock ? product.stock + ' in stock' : 'Out of stock'}</p><ProductActions product={product} /></div></section></>;
}
