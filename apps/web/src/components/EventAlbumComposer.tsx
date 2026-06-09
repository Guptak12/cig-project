'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Props {
  eventId: string;
}

export function EventAlbumComposer({ eventId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user || (user.role !== 'ADMIN' && user.role !== 'CLUB')) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await api.events.createAlbum(eventId, {
        name,
        isPublic,
      });
      setName('');
      setIsPublic(true);
      setSuccess('Album created.');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>Create album</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Add a new album for this event before uploads start.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label htmlFor="album-name" className="form-label">Album name</label>
          <input
            id="album-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Main album"
            minLength={2}
            required
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Public album
        </label>

        {error && <p className="form-error">{error}</p>}
        {success && (
          <p style={{ color: 'var(--color-success)', fontSize: '0.9rem' }}>
            {success}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : 'Create album'}
          </button>
        </div>
      </form>
    </section>
  );
}
