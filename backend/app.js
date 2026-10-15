import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import customerRoutes from './routes/customer.routes.js';
import productRoutes from './routes/product.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';

const app = express();
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());
// Reject cross-site writes while keeping the frontend and API on one origin.
app.use((req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('sec-fetch-site') === 'cross-site') return res.status(403).json({ message: 'Cross-site request rejected' });
  next();
});
app.get('/api/health', (req, res) => res.json({ success: true }));
const dist = fileURLToPath(new URL('../dist', import.meta.url));
app.use(express.static(dist));
app.use((req, res, next) => {
  if (req.method === 'GET' && req.get('accept')?.includes('text/html') && !req.path.startsWith('/customers') && !req.path.startsWith('/api/')) return res.sendFile(path.join(dist, 'index.html'));
  next();
});
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts(['html', 'json']) === 'html') return next();
  res.status(404).json({ message: 'Endpoint not found' });
});
app.get('/{*path}', (req, res) => res.sendFile(path.join(dist, 'index.html')));
app.use((error, req, res, next) => {
  if (error.code === 11000) return res.status(409).json({ message: 'Email already exists' });
  const status = error.status || (['ValidationError', 'CastError'].includes(error.name) ? 400 : 500);
  res.status(status).json({ success: false, message: status === 500 ? 'Server error. Please try again' : error.message });
});
export default app;
