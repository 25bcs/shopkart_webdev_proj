import mongoose from 'mongoose';

export function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export function validId(id) {
  if (!mongoose.isObjectIdOrHexString(id)) fail(400, 'Invalid ID');
}

export function addressFields(input = {}) {
  const fields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
  const address = Object.fromEntries(fields.map(key => [key, typeof input[key] === 'string' ? input[key].trim() : '']));
  if (fields.some(key => !address[key])) fail(400, 'All shipping fields are required');
  if (!/^\d{10}$/.test(address.phone)) fail(400, 'Phone must contain 10 digits');
  if (!/^\d{6}$/.test(address.pincode)) fail(400, 'Pincode must contain 6 digits');
  return address;
}
