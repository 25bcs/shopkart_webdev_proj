import bcrypt from 'bcrypt';
import Customer from '../models/customer.model.js';
import generateToken, { cookieOptions } from '../utils/generateToken.js';
import { fail } from '../utils/helpers.js';

function profile(customer) {
  return { _id: customer._id, fullName: customer.fullName, email: customer.email, phone: customer.phone };
}

export async function register(req, res) {
  const { fullName, email, password, phone } = req.body;
  if (![fullName, email, password, phone].every(value => typeof value === 'string' && value.trim())) fail(400, 'All fields are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) fail(400, 'Enter a valid email');
  if (password.length < 6 || Buffer.byteLength(password) > 72) fail(400, 'Password must be 6 to 72 bytes');
  if (!/^\d{10}$/.test(phone.trim())) fail(400, 'Phone must contain 10 digits');
  const customer = await Customer.create({ fullName, email, phone, password: await bcrypt.hash(password, 12) });
  res.status(201).json({ success: true, customer: profile(customer) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') fail(401, 'Invalid credentials');
  const customer = await Customer.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!customer || !await bcrypt.compare(password, customer.password)) fail(401, 'Invalid credentials');
  generateToken(res, customer._id);
  res.json({ success: true, customer: profile(customer) });
}

export function me(req, res) { res.json(profile(req.user)); }

export function logout(req, res) {
  res.clearCookie('token', cookieOptions());
  res.json({ success: true });
}
