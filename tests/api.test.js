import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import nock from 'nock';
import app from '../backend/app.js';
import Customer from '../backend/models/customer.model.js';
import Product from '../backend/models/product.model.js';
import Order from '../backend/models/order.model.js';

let database;
let product;
let order;
const alice = request.agent(app);
const bob = request.agent(app);
const address = { fullName: 'Alice Test', phone: '9876543210', addressLine1: '12 Main Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' };
const account = { fullName: 'Alice Test', email: 'alice@example.com', password: 'secret123', phone: '9876543210' };

before(async () => {
  process.env.JWT_SECRET = 'test-secret-for-isolated-tests-only';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_local';
  process.env.RAZORPAY_KEY_SECRET = 'test-payment-secret';
  database = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.24' } });
  await mongoose.connect(database.getUri());
});
after(async () => {
  nock.cleanAll();
  await mongoose.disconnect();
  await database?.stop();
});

test('registration validates fields, rejects duplicates and stores only a password hash', async () => {
  await alice.post('/customers/register').send({}).expect(400);
  await alice.post('/customers/register').send({ ...account, password: '123' }).expect(400);
  const result = await alice.post('/customers/register').send(account).expect(201);
  assert.equal(result.body.customer.password, undefined);
  const stored = await Customer.findOne({ email: account.email }).select('+password');
  assert.match(stored.password, /^\$2/);
  assert.notEqual(stored.password, account.password);
  await alice.post('/customers/register').send(account).expect(409);
});

test('login uses an HttpOnly cookie and profile requires authentication', async () => {
  await request(app).get('/customers/me').expect(401);
  await alice.post('/customers/login').send({ email: account.email, password: 'wrong' }).expect(401);
  const result = await alice.post('/customers/login').send(account).expect(200);
  assert.match(result.headers['set-cookie'][0], /HttpOnly/);
  assert.match(result.headers['set-cookie'][0], /SameSite=Strict/);
  const profile = await alice.get('/customers/me').expect(200);
  assert.equal(profile.body.email, account.email);
  assert.equal(profile.body.password, undefined);
  await bob.post('/customers/register').send({ ...account, email: 'bob@example.com' }).expect(201);
  await bob.post('/customers/login').send({ ...account, email: 'bob@example.com' }).expect(200);
});

test('product API validates products and supports literal search, category and details', async () => {
  await request(app).post('/products').send({ name: 'Bad' }).expect(400);
  await request(app).post('/products').send({ name: 'Bad', description: 'Bad', price: -1, category: 'Home', image: '/images/mug.svg', stock: 2 }).expect(400);
  const result = await request(app).post('/products').send({ name: 'Test mug', description: 'A simple mug', price: 349, category: 'Home', image: '/images/mug.svg', stock: 5 }).expect(201);
  product = result.body.product;
  assert.equal((await request(app).get('/products?search=mug&category=Home')).body.count, 1);
  assert.equal((await request(app).get('/products?search=.*')).body.count, 0);
  assert.equal((await request(app).get('/products?category=Clothing')).body.count, 0);
  await request(app).get('/products/bad-id').expect(400);
  await request(app).get('/products/' + new mongoose.Types.ObjectId()).expect(404);
  await request(app).get('/products/' + product._id).expect(200);
});

test('wishlist has no duplicates and is private to the logged-in customer', async () => {
  await request(app).post('/wishlist/' + product._id).expect(401);
  await alice.post('/wishlist/invalid').expect(400);
  await alice.post('/wishlist/' + product._id).expect(200);
  await alice.post('/wishlist/' + product._id).expect(409);
  assert.equal((await alice.get('/wishlist')).body.wishlist.length, 1);
  assert.equal((await bob.get('/wishlist')).body.wishlist.length, 0);
  await alice.delete('/wishlist/' + product._id).expect(200);
  assert.equal((await alice.get('/wishlist')).body.wishlist.length, 0);
});

test('cart increments products, checks stock and rejects invalid quantities', async () => {
  await alice.post('/cart/' + product._id).expect(200);
  await alice.post('/cart/' + product._id).expect(200);
  assert.equal((await alice.get('/cart')).body.cart[0].quantity, 2);
  for (const quantity of [0, -1, 1.5, 6, '2']) await alice.patch('/cart/' + product._id).send({ quantity }).expect(400);
  assert.equal((await bob.get('/cart')).body.cart.length, 0);
  await alice.patch('/cart/' + product._id).send({ quantity: 3 }).expect(200);
  await alice.delete('/cart/' + product._id).expect(200);
  assert.equal((await alice.get('/cart')).body.cart.length, 0);
  await alice.post('/cart/' + product._id).expect(200);
  await alice.post('/cart/' + product._id).expect(200);
});

test('checkout validates shipping, uses database totals and leaves the cart pending', async () => {
  await bob.post('/orders/create-payment-order').send({ shippingAddress: address }).expect(400);
  await alice.post('/orders/create-payment-order').send({ shippingAddress: { ...address, pincode: '123' } }).expect(400);
  await alice.post('/orders/create-payment-order').send({ shippingAddress: { ...address, city: '   ' } }).expect(400);
  nock('https://api.razorpay.com').post('/v1/orders', body => body.amount === 69800 && body.currency === 'INR').reply(200, { id: 'order_test1', amount: 69800, currency: 'INR' });
  const result = await alice.post('/orders/create-payment-order').send({ shippingAddress: address, totalAmount: 1 }).expect(201);
  order = result.body.order;
  assert.equal(order.totalAmount, 698);
  assert.equal(order.paymentStatus, 'PENDING');
  assert.equal(order.items[0].name, product.name);
  assert.equal((await alice.get('/cart')).body.cart[0].quantity, 2);
  await bob.get('/orders/' + order._id).expect(404);
});

test('fake signatures keep order, cart and stock unchanged', async () => {
  await alice.post('/orders/verify-payment').send({ razorpay_order_id: 'order_test1', razorpay_payment_id: 'pay_test1', razorpay_signature: '0'.repeat(64) }).expect(400);
  assert.equal((await Order.findById(order._id)).paymentStatus, 'PENDING');
  assert.equal((await Product.findById(product._id)).stock, 5);
  assert.equal((await alice.get('/cart')).body.cart[0].quantity, 2);
});

test('verification checks captured payment, confirms once and preserves order snapshots', async () => {
  const payload = { razorpay_order_id: 'order_test1', razorpay_payment_id: 'pay_test1', razorpay_signature: crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update('order_test1|pay_test1').digest('hex') };
  nock('https://api.razorpay.com').get('/v1/payments/pay_test1').reply(200, { order_id: 'order_test1', amount: 1, currency: 'INR', status: 'captured' });
  await alice.post('/orders/verify-payment').send(payload).expect(400);
  nock('https://api.razorpay.com').get('/v1/payments/pay_test1').twice().reply(200, { order_id: 'order_test1', amount: 69800, currency: 'INR', status: 'captured' });
  await alice.post('/orders/verify-payment').send(payload).expect(200);
  await alice.post('/orders/verify-payment').send(payload).expect(200);
  assert.equal((await Product.findById(product._id)).stock, 3);
  assert.equal((await alice.get('/cart')).body.cart.length, 0);
  await Product.updateOne({ _id: product._id }, { price: 999, name: 'Changed name' });
  const detail = await alice.get('/orders/' + order._id).expect(200);
  assert.equal(detail.body.order.items[0].name, 'Test mug');
  assert.equal(detail.body.order.totalAmount, 698);
  assert.equal(detail.body.order.status, 'PLACED');
  assert.equal((await bob.get('/orders')).body.orders.length, 0);
  assert.ok(nock.isDone());
});

test('logout clears the cookie and closes protected routes', async () => {
  const result = await alice.post('/customers/logout').expect(200);
  assert.match(result.headers['set-cookie'][0], /Expires=Thu, 01 Jan 1970/);
  await alice.get('/customers/me').expect(401);
  await alice.get('/cart').expect(401);
});
