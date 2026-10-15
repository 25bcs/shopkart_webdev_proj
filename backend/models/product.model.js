import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, validate: value => Number.isFinite(value) && value > 0 },
  category: { type: String, required: true, trim: true },
  image: { type: String, required: true, trim: true },
  stock: { type: Number, required: true, min: 0, validate: Number.isInteger }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
