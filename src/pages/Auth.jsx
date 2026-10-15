import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useShop } from '../context/ShopContext';

export default function Auth({ register = false }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { setUser } = useShop();
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await api('/customers/' + (register ? 'register' : 'login'), 'POST', form);
      if (register) navigate('/login?registered=1');
      else { setUser(result.customer); navigate('/home'); }
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <section className="auth-box"><small>SHOPKART ACCOUNT</small><h1>{register ? 'Create an account' : 'Welcome back'}</h1><p>{register ? 'Register to start shopping.' : 'Log in to your ShopKart account.'}</p>{!register && new URLSearchParams(location.search).has('registered') && <p className="notice">Account created. You can log in now.</p>}<form onSubmit={submit}>{(register ? ['fullName', 'email', 'phone', 'password'] : ['email', 'password']).map(name => <label key={name}>{({ fullName: 'Full name', email: 'Email', password: 'Password', phone: 'Phone number' })[name]}<input name={name} type={name === 'password' ? 'password' : name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'text'} value={form[name]} onChange={event => setForm({ ...form, [name]: event.target.value })} required minLength={name === 'password' ? 6 : undefined} maxLength={name === 'password' ? 72 : undefined} pattern={name === 'phone' ? '[0-9]{10}' : undefined} autoComplete={name === 'password' ? (register ? 'new-password' : 'current-password') : name === 'fullName' ? 'name' : name === 'phone' ? 'tel' : 'email'} /></label>)}{error && <p className="error" role="alert">{error}</p>}<button disabled={busy}>{busy ? 'Please wait...' : register ? 'Create account' : 'Login'}</button></form><p>{register ? 'Already have an account?' : 'New to ShopKart?'} <Link to={register ? '/login' : '/register'}>{register ? 'Login' : 'Create account'}</Link></p></section>;
}
