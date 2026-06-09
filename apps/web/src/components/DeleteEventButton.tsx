'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Props {
  eventId: string;
}

export function DeleteEventButton({ eventId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!user || (user.role !== 'ADMIN' && user.role !== 'CLUB')) {
    return null;
  }

  async function handleDelete() {
    const confirmed = window.confirm('Delete this event and all of its albums?');
    if (!confirmed) return;

    setError('');
    setIsDeleting(true);

    try {
      await api.events.delete(eventId);
      router.push('/events');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={handleDelete}
        disabled={isDeleting}
        style={{ borderColor: 'rgba(248,113,113,0.35)', color: 'var(--color-danger)' }}
      >
        {isDeleting ? <span className="spinner" /> : 'Delete event'}
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
