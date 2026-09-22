'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useRegister } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      { username, email, password },
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

      <h3>Create your account</h3>
      <p>Free forever. Upgrade whenever you like.</p>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="field">
          <label className="field-label">Username</label>
          <div className="input-group">
            <Icon name="user" className="lead" size={18} />
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jordan"
              minLength={3}
              required
            />
          </div>
        </div>

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
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>
        </div>

        {register.isError && (
          <div className="field-hint err">
            {register.error instanceof ApiError ? register.error.message : 'Registration failed'}
          </div>
        )}

        <button className="btn btn-primary block" type="submit" disabled={register.isPending}>
          {register.isPending ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p style={{ marginTop: 'var(--space-5)', marginBottom: 0 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>
          Log in
        </Link>
      </p>
    </div>
  );
}
