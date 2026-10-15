import { useShop } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import Status from '../components/Status';

export default function Wishlist() {
  const { wishlist, syncing, syncError, refresh } = useShop();
  return <><h1>Your wishlist</h1><p>Products saved for later.</p>{syncing || syncError || !wishlist.length ? <Status loading={syncing} error={syncError} empty="Your wishlist is empty." retry={() => refresh().catch(() => {})} /> : <div className="grid">{wishlist.map(product => <ProductCard key={product._id} product={product} />)}</div>}</>;
}
