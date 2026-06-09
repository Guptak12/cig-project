'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import type { AuthUser } from '@/lib/api';

type SignupRole = AuthUser['role'];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SignupRole>('MEMBER');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await register(name, email, password, role);

      if (result.needsApproval) {
        router.push(`/auth/pending?email=${encodeURIComponent(email)}`);
        return;
      }

      router.push('/my-photos');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <span style={{ fontSize: '2.5rem' }}>✨</span>
          <h1
            style={{
              marginTop: 'var(--space-3)',
              fontSize: '1.5rem',
              fontWeight: 800,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Create your account
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: 'var(--space-2)' }}>
            Join your club&apos;s media platform
          </p>
        </div>

        <form className="card" style={{ padding: 'var(--space-8)' }} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">Full Name</label>
              <input
                id="reg-name"
                type="text"
                className="input"
                placeholder="Alex Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Email</label>
              <input
                id="reg-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-role" className="form-label">Account type</label>
              <select
                id="reg-role"
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value as SignupRole)}
              >
              <option value="MEMBER">Member</option>
              <option value="PHOTOGRAPHER">Photographer</option>
                <option value="CLUB">Club Account</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">Password</label>
              <input
                id="reg-password"
                type="password"
                className="input"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem',
                lineHeight: 1.6,
              }}
            >
              Member accounts activate immediately. Photographer and club admin accounts wait for approval from an existing admin before login is allowed.
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-4)' }}
              disabled={isLoading}
            >
              {isLoading ? <span className="spinner" /> : 'Create Account'}
            </button>

          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
