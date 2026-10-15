import mongoose from 'mongoose';
import Product from './models/product.model.js';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopkart?replicaSet=rs0');
const products = [
  ['Wireless headphones', 'Comfortable over-ear headphones with wireless audio and a rechargeable battery.', 2499, 'Electronics', 'headphones', 12],
  ['Everyday backpack', 'A sturdy canvas backpack with a laptop pocket and adjustable straps.', 1299, 'Accessories', 'backpack', 18],
  ['Cotton T-shirt', 'A soft cotton T-shirt with a regular fit for everyday wear.', 599, 'Clothing', 'shirt', 24],
  ['Desk lamp', 'An adjustable desk lamp with a warm light for reading and studying.', 899, 'Home', 'lamp', 8],
  ['Mechanical keyboard', 'A compact wired keyboard with mechanical switches and a simple layout.', 2999, 'Electronics', 'keyboard', 10],
  ['Ceramic mug', 'A 350 ml ceramic mug for coffee or tea. Dishwasher safe.', 349, 'Home', 'mug', 20],
  ['Canvas sneakers', 'Light canvas sneakers with a rubber sole for daily use.', 1499, 'Clothing', 'shoes', 6],
  ['Steel water bottle', 'A reusable 750 ml steel bottle with a screw-top lid.', 699, 'Accessories', 'bottle', 0]
];
for (const [name, description, price, category, image, stock] of products) {
  await Product.updateOne({ name }, { $setOnInsert: { name, description, price, category, image: '/images/' + image + '.svg', stock } }, { upsert: true });
}
console.log('Sample products added. Existing products kept.');
await mongoose.disconnect();
