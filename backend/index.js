import mongoose from 'mongoose';
import app from './app.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace-with-a-long-random-secret') throw new Error('Set JWT_SECRET in backend/.env');
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopkart?replicaSet=rs0');
app.listen(process.env.PORT || 5000, '127.0.0.1', () => console.log('ShopKart API: http://127.0.0.1:' + (process.env.PORT || 5000)));
