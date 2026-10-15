import Customer from '../models/customer.model.js';
import Product from '../models/product.model.js';
import { validId, fail } from '../utils/helpers.js';

export async function getWishlist(req, res) {
  await req.user.populate('wishlist');
  res.json({ success: true, count: req.user.wishlist.length, wishlist: req.user.wishlist });
}

export async function addWishlist(req, res) {
  const id = req.params.productId;
  validId(id);
  if (!await Product.exists({ _id: id })) fail(404, 'Product not found');
  const result = await Customer.updateOne({ _id: req.user._id, wishlist: { $ne: id } }, { $addToSet: { wishlist: id } });
  if (!result.modifiedCount) fail(409, 'Product already in wishlist');
  res.json({ success: true });
}

export async function removeWishlist(req, res) {
  validId(req.params.productId);
  const result = await Customer.updateOne({ _id: req.user._id, wishlist: req.params.productId }, { $pull: { wishlist: req.params.productId } });
  if (!result.modifiedCount) fail(404, 'Product not in wishlist');
  res.json({ success: true });
}
