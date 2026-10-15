import mongoose from 'mongoose';
import Customer from '../models/customer.model.js';
import Product from '../models/product.model.js';
import { fail, validId } from '../utils/helpers.js';

export async function getCart(req, res) {
  await req.user.populate('cart.product');
  const cart = req.user.cart.filter(item => item.product);
  res.json({ success: true, cart });
}

export async function changeCart(req, res) {
  const id = req.params.productId;
  validId(id);
  // A transaction keeps simultaneous cart updates from losing quantities.
  await mongoose.connection.transaction(async session => {
    const customer = await Customer.findById(req.user._id).session(session);
    const item = customer.cart.find(row => row.product.toString() === id);
    if (req.method === 'DELETE') {
      if (!item) fail(404, 'Product not in cart');
      customer.cart = customer.cart.filter(row => row.product.toString() !== id);
    } else {
      const product = await Product.findById(id).session(session);
      if (!product) fail(404, 'Product not found');
      if (req.method === 'PATCH' && !item) fail(404, 'Product not in cart');
      const quantity = req.method === 'POST' ? (item?.quantity || 0) + 1 : req.body.quantity;
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) fail(400, 'Quantity must be at least 1 and within available stock');
      if (item) item.quantity = quantity;
      else customer.cart.push({ product: id, quantity });
    }
    await customer.save({ session });
  });
  res.json({ success: true });
}
