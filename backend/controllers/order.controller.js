import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import Customer from '../models/customer.model.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import { fail, validId, addressFields } from '../utils/helpers.js';

function paymentClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) fail(503, 'Add Razorpay test keys to backend/.env to enable checkout');
  if (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_')) fail(503, 'Use a Razorpay test key for this lab');
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

export async function createPaymentOrder(req, res) {
  const shippingAddress = addressFields(req.body.shippingAddress);
  await req.user.populate('cart.product');
  if (!req.user.cart.length) fail(400, 'Cart is empty');
  const items = req.user.cart.map(({ product, quantity }) => {
    if (!product || product.stock < quantity) fail(400, 'A cart product is unavailable or has insufficient stock');
    return { product: product._id, name: product.name, price: product.price, quantity, image: product.image };
  });
  // Prices and totals always come from MongoDB.
  const totalAmount = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
  const payment = await paymentClient().orders.create({ amount: Math.round(totalAmount * 100), currency: 'INR' });
  const order = await Order.create({ user: req.user._id, items, shippingAddress, totalAmount, razorpayOrderId: payment.id });
  res.status(201).json({ success: true, order, key: process.env.RAZORPAY_KEY_ID, amount: payment.amount, currency: payment.currency, razorpayOrderId: payment.id });
}

export async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(value => typeof value === 'string' && value)) fail(400, 'Payment details are required');
  let order = await Order.findOne({ user: req.user._id, razorpayOrderId: razorpay_order_id });
  if (!order) fail(404, 'Order not found');
  const client = paymentClient();
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(order.razorpayOrderId + '|' + razorpay_payment_id).digest('hex');
  if (!/^[a-f0-9]{64}$/.test(razorpay_signature) || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature))) fail(400, 'Invalid payment signature');
  const payment = await client.payments.fetch(razorpay_payment_id);
  if (payment.order_id !== order.razorpayOrderId || payment.amount !== Math.round(order.totalAmount * 100) || payment.currency !== 'INR' || payment.status !== 'captured') fail(400, 'Payment is not captured or does not match the order');
  await mongoose.connection.transaction(async session => {
    order = await Order.findById(order._id).session(session);
    if (order.paymentStatus === 'PAID') return;
    // Stock, order status and cart changes commit together.
    for (const item of order.items) {
      const result = await Product.updateOne({ _id: item.product, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { session });
      if (!result.modifiedCount) fail(409, 'Stock changed after payment. Contact the shop with your payment ID for a refund');
    }
    order.paymentStatus = 'PAID';
    order.status = 'PLACED';
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save({ session });
    const customer = await Customer.findById(req.user._id).session(session);
    for (const item of order.items) {
      const row = customer.cart.find(entry => entry.product.equals(item.product));
      if (row) row.quantity -= item.quantity;
    }
    customer.cart = customer.cart.filter(item => item.quantity > 0);
    await customer.save({ session });
  });
  res.json({ success: true, order });
}

export async function getOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
}

export async function getOrder(req, res) {
  validId(req.params.id);
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) fail(404, 'Order not found');
  res.json({ success: true, order });
}
