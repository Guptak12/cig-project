import type { Metadata } from 'next';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${apiUrl}/events/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      return { title: json.data?.name ?? 'Event', description: json.data?.description ?? '' };
    }
  } catch { /* fallback */ }
  return { title: 'Event' };
}

interface EventDetail {
  id: string;
  name: string;
  description: string | null;
  date: string;
  isPublic: boolean;
  club: { id: string; name: string; logoUrl: string | null };
  albums: { id: string; name: string; isPublic: boolean; qrToken: string | null }[];
}

async function getEvent(id: string): Promise<EventDetail | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const res = await fetch(`${apiUrl}/events/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch (err) {
    console.warn(`[Prerender] Failed to fetch event ${id} during build (API is offline):`, err);
    return null;
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>Event not found.</p>
          <Link href="/events" className="btn btn-ghost" style={{ marginTop: 'var(--space-4)' }}>
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
        <Link href="/events" style={{ color: 'var(--color-text-muted)' }}>Events</Link>
        {' › '}
        <span style={{ color: 'var(--color-text)' }}>{event.name}</span>
      </nav>

      {/* Event header */}
      <header style={{ marginBottom: 'var(--space-10)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <span className="badge badge-purple">{event.club.name}</span>
          {!event.isPublic && <span className="badge badge-amber">🔒 Private</span>}
        </div>

        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-3)' }}>
          {event.name}
        </h1>

        {event.description && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', maxWidth: 640, lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
            {event.description}
          </p>
        )}

        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-subtle)' }}>
          📅{' '}
          {new Date(event.date).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </header>

      {/* Albums */}
      <section>
        <h2 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 'var(--space-5)', color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Albums ({event.albums.length})
        </h2>

        {event.albums.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <p>No albums yet for this event.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {event.albums.map((album) => (
              <Link key={album.id} href={`/events/${event.id}/albums/${album.id}`} style={{ display: 'block' }}>
                <div className="card" style={{ padding: 'var(--space-6)' }}>
                  {/* Album cover placeholder */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--gradient-primary)',
                      opacity: 0.15,
                      marginBottom: 'var(--space-4)',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{album.name}</h3>
                    {!album.isPublic && <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>🔒</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
