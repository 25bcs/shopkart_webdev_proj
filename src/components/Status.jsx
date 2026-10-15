import { Link } from 'react-router-dom';

export default function Status({ loading, error, empty, retry }) {
  if (loading) return <p role="status" className="notice">Loading...</p>;
  if (error) return <div className="notice"><p className="error" role="alert">{error}</p><button onClick={retry}>Try again</button></div>;
  return <div className="notice"><p>{empty}</p><Link className="button" to="/home">Browse products</Link></div>;
}
