import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import { getWishlist, addWishlist, removeWishlist } from '../controllers/wishlist.controller.js';
const router = Router();
router.use(auth);
router.get('/', getWishlist);
router.post('/:productId', addWishlist);
router.delete('/:productId', removeWishlist);
export default router;
