import type { Metadata } from 'next';
import Link from 'next/link';
import { EventsPageActions } from '@/components/EventsPageActions';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Browse all club events and their photo albums.',
};

export const dynamic = 'force-dynamic';

interface Event {
  id: string;
  name: string;
  description: string | null;
  date: string;
  isPublic: boolean;
  club: { id: string; name: string; logoUrl: string | null };
  albums: { id: string; name: string }[];
}

async function getEvents(): Promise<Event[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const res = await fetch(`${apiUrl}/events`, {
      cache: 'no-store', // Always fetch fresh data so UI reflects deletions/additions
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch (err) {
    console.warn('[Prerender] Failed to fetch events during build (API is offline):', err);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="container" style={{ paddingTop: 'var(--space-10)', paddingBottom: 'var(--space-16)' }}>
      <header style={{ marginBottom: 'var(--space-10)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
          <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
          Events
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Browse and explore all club events — sorted by name.
        </p>
          </div>
          <EventsPageActions />
        </div>
      </header>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>No events yet. Check back soon!</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-5)',
          }}
        >
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} style={{ display: 'block' }}>
              <article className="card" style={{ padding: 'var(--space-6)' }}>
                {/* Club tag */}
                <span className="badge badge-purple" style={{ marginBottom: 'var(--space-3)' }}>
                  {event.club.name}
                </span>

                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                  {event.name}
                </h2>

                {event.description && (
                  <p
                    style={{
                      color: 'var(--color-text-muted)',
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      marginBottom: 'var(--space-4)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {event.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                    {new Date(event.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="badge badge-pink">
                    {event.albums.length} album{event.albums.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
