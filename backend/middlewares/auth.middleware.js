import jwt from 'jsonwebtoken';
import Customer from '../models/customer.model.js';
import { fail } from '../utils/helpers.js';

export default async function auth(req, res, next) {
  let payload;
  try { payload = jwt.verify(req.cookies.token, process.env.JWT_SECRET); }
  catch { fail(401, 'Please log in'); }
  const customer = await Customer.findById(payload.id);
  if (!customer) fail(401, 'Please log in');
  req.user = customer;
  next();
}
