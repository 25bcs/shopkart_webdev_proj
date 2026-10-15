import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, name: String, price: Number, quantity: Number, image: String }],
  shippingAddress: { fullName: String, phone: String, addressLine1: String, city: String, state: String, pincode: String },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
  status: { type: String, enum: ['PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'], default: 'PENDING_PAYMENT' },
  razorpayOrderId: { type: String, unique: true, sparse: true },
  razorpayPaymentId: String
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
