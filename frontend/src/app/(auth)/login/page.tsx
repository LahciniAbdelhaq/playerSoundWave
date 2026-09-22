'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useLogin } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('jordan@soundwave.fm');
  const [password, setPassword] = useState('password123');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      { onSuccess: () => router.push('/') },
    );
  };

  return (
    <div className="modal" style={{ transform: 'none', width: 'min(420px, 100%)' }}>
      <div className="side-brand" style={{ padding: 0, marginBottom: 'var(--space-5)' }}>
        <div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="name" style={{ fontWeight: 700, fontSize: 17 }}>
          Sound<b style={{ color: 'var(--brand)' }}>Wave</b>
        </div>
      </div>

      <h3>Welcome back</h3>
      <p>Log in to continue listening.</p>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="field">
          <label className="field-label">Email</label>
          <div className="input-group">
            <Icon name="mail" className="lead" size={18} />
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="field-label">Password</label>
          <div className="input-group">
            <Icon name="lock" className="lead" size={18} />
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {login.isError && (
          <div className="field-hint err">
            {login.error instanceof ApiError ? login.error.message : 'Login failed'}
          </div>
        )}

        <button className="btn btn-primary block" type="submit" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <p style={{ marginTop: 'var(--space-5)', marginBottom: 0 }}>
        New here?{' '}
        <Link href="/register" style={{ color: 'var(--brand)', fontWeight: 600 }}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
