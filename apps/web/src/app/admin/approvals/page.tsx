'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, type PendingUser } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function ApprovalsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && user?.role !== 'ADMIN') {
      router.push('/events');
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;

    api.admin
      .pendingUsers()
      .then(setPending)
      .catch((err) => setActionError((err as Error).message))
      .finally(() => setIsLoading(false));
  }, [user]);

  async function approveUser(id: string) {
    setActionError('');
    try {
      const approved = await api.admin.approveUser(id);
      setPending((curr) => curr.filter((item) => item.id !== approved.id));
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', maxWidth: 960 }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <Link href="/events" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Events
          </Link>
          {' › '}
          <span style={{ color: 'var(--color-text)' }}>Approvals</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
          Pending approvals
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Approve photographer and club admin registrations before they can log in.
        </p>
      </header>

      {actionError && (
        <p className="form-error" style={{ marginBottom: 'var(--space-5)' }}>
          {actionError}
        </p>
      )}

      {pending.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <p>No pending approvals right now.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {pending.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-5)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                  <strong style={{ fontSize: '0.98rem' }}>{item.name}</strong>
                  <span className="badge badge-purple">{item.role}</span>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{item.email}</p>
                <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.8rem', marginTop: 'var(--space-1)' }}>
                  Requested on {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => approveUser(item.id)}>
                Approve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
