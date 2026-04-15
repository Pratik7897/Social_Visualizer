import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

function AuthLayout({ title, subtitle, children }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--cream)',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: 'white', fontWeight: 700, fontSize: '1.125rem',
          }}>SC</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 500, marginBottom: 6 }}>{title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{subtitle}</p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill for demo
  const demoFill = () => setForm({ email: 'alex@example.com', password: 'password123' });

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Email</label>
          <input className="input" type="email" placeholder="you@example.com" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Password</label>
          <input className="input" type="password" placeholder="••••••••" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}
          style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 4, fontSize: '0.9375rem' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <button onClick={demoFill} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
        Use demo account
      </button>

      <div className="divider" />
      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        No account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 500 }}>Create one</Link>
      </p>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '', bio: '', occupation: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      addToast('Account created! Welcome 🎉', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', placeholder, required }) => (
    <div>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
        {label} {required && <span style={{ color: 'var(--rose)' }}>*</span>}
      </label>
      <input className="input" type={type} placeholder={placeholder}
        value={form[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
        required={required} />
    </div>
  );

  const handleNext = () => {
    if (form.username && form.displayName && form.email && form.password) {
      setStep(2);
    } else {
      addToast('Please fill all required fields 👋', 'info');
    }
  };

  const demoFillReg = () => setForm({
    username: 'new_user',
    displayName: 'New User',
    email: 'new@example.com',
    password: 'password123',
    bio: 'Excited to join!',
    occupation: 'Developer',
    location: 'Earth'
  });

  return (
    <AuthLayout title="Join Social Connect" subtitle="Find and connect with people">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {step === 1 ? (
          <>
            <Field label="Username" name="username" placeholder="alex_morgan" required />
            <Field label="Display name" name="displayName" placeholder="Alex Morgan" required />
            <Field label="Email" name="email" type="email" placeholder="you@example.com" required />
            <Field label="Password" name="password" type="password" placeholder="Min 6 characters" required />
            <button type="button" className="btn btn-primary" onClick={handleNext}
              style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 4 }}>
              Continue →
            </button>
          </>
        ) : (
          <>
            <Field label="Bio" name="bio" placeholder="Tell us about yourself…" />
            <Field label="Occupation" name="occupation" placeholder="Software Engineer" />
            <Field label="Location" name="location" placeholder="San Francisco, CA" />
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, justifyContent: 'center', padding: '11px' }}>
                {loading ? 'Creating…' : 'Create account'}
              </button>
            </div>
          </>
        )}
      </form>

      <button onClick={demoFillReg} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
        Quick fill info
      </button>

      <div className="divider" />
      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>Sign in</Link>
      </p>
    </AuthLayout>
  );
}
