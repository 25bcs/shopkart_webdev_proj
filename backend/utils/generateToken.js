import jwt from 'jsonwebtoken';

export const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });

export default function generateToken(res, id) {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.cookie('token', token, { ...cookieOptions(), maxAge: 86400000 });
}
