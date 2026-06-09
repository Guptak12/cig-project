'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, type Club } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function NewEventPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [clubId, setClubId] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && user && user.role !== 'ADMIN' && user.role !== 'CLUB') {
      router.push('/events');
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    api.clubs
      .list()
      .then((items) => {
        setClubs(items);
        if (items.length > 0) {
          setClubId((current) => current || items[0].id);
        }
      })
      .catch((err) => setError((err as Error).message));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const created = await api.events.create({
        name,
        description: description.trim() || undefined,
        date: new Date(date).toISOString(),
        clubId,
        isPublic,
      });

      router.push(`/events/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', maxWidth: 760 }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <Link href="/events" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Events
          </Link>
          {' › '}
          <span style={{ color: 'var(--color-text)' }}>Create event</span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
          Create Event
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Add a new event, assign it to a club, and make it available for albums and uploads.
        </p>
      </header>

      <form className="card" style={{ padding: 'var(--space-8)' }} onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
          <div className="form-group">
            <label htmlFor="event-name" className="form-label">Event name</label>
            <input
              id="event-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Freshers Welcome Night"
              minLength={2}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-description" className="form-label">Description</label>
            <textarea
              id="event-description"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short event summary"
              rows={4}
              style={{ resize: 'vertical', minHeight: 120 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label htmlFor="event-date" className="form-label">Date and time</label>
              <input
                id="event-date"
                className="input"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
            <label htmlFor="event-club" className="form-label">Club</label>
              <select
                id="event-club"
                className="input"
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                required
              >
                <option value="">Select club…</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public event
          </label>

          {error && <p className="form-error">{error}</p>}

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <Link href="/events" className="btn btn-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isLoading || clubs.length === 0}>
              {isLoading ? <span className="spinner" /> : 'Create event'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
