import Product from '../models/product.model.js';
import { fail, validId } from '../utils/helpers.js';

export async function listProducts(req, res) {
  const filter = {};
  if (req.query.search) {
    const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.name = { $regex: search, $options: 'i' };
  }
  if (req.query.category) filter.category = String(req.query.category);
  const products = await Product.find(filter).sort({ createdAt: -1 });
  const categories = await Product.distinct('category');
  res.json({ success: true, count: products.length, products, categories });
}

export async function getProduct(req, res) {
  validId(req.params.id);
  const product = await Product.findById(req.params.id);
  if (!product) fail(404, 'Product not found');
  res.json({ success: true, product });
}

export async function createProduct(req, res) {
  const { name, description, price, category, image, stock } = req.body;
  const product = await Product.create({ name, description, price, category, image, stock });
  res.status(201).json({ success: true, product });
}
