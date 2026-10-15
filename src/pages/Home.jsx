import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import Status from '../components/Status';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => { setSearch(params.get('search') || ''); }, [params]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api('/products?' + params.toString()).then(data => { if (active) setData(data); }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params, retry]);
  return <><section className="intro"><small>EVERYDAY SHOPPING</small><h1>A few good things.<br />All in one place.</h1><p>Browse our collection and find what you need.</p></section><section><div className="section-heading"><h2>All products</h2><span>{data?.count || 0} products</span></div><form className="filters" onSubmit={event => { event.preventDefault(); const next = new URLSearchParams(params); search.trim() ? next.set('search', search.trim()) : next.delete('search'); setParams(next); }}><label className="search">Search products<input type="search" placeholder="Search by name" value={search} onChange={event => setSearch(event.target.value)} /></label><label>Category<select value={params.get('category') || ''} onChange={event => { const next = new URLSearchParams(params); event.target.value ? next.set('category', event.target.value) : next.delete('category'); setParams(next); }}><option value="">All categories</option>{data?.categories.map(category => <option key={category}>{category}</option>)}</select></label><button>Search</button>{params.size > 0 && <button type="button" className="outline" onClick={() => { setSearch(''); setParams({}); }}>Clear</button>}</form>{loading || error ? <Status loading={loading} error={error} retry={() => setRetry(retry + 1)} /> : data?.products.length ? <div className="grid">{data.products.map(product => <ProductCard key={product._id} product={product} />)}</div> : <p className="notice">No products found. Try another search or category.</p>}</section></>;
}
