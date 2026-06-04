import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: 'Shared Album',
  description: 'View this shared event album.',
};

interface AlbumShare {
  id: string;
  name: string;
  event: { name: string; date: string; club: { name: string } };
  media: { id: string; thumbKey: string | null; tags: string[] }[];
}

async function getSharedAlbum(token: string): Promise<AlbumShare | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const res = await fetch(`${apiUrl}/albums/share/${token}`, {
    next: { revalidate: 120 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const album = await getSharedAlbum(token);
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL ?? '';

  if (!album) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🔗</div>
          <p>This share link is invalid or has expired.</p>
          <Link href="/" className="btn btn-ghost" style={{ marginTop: 'var(--space-4)' }}>
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      {/* Header */}
      <div
        style={{
          padding: 'var(--space-8)',
          marginBottom: 'var(--space-8)',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--gradient-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        <span className="badge badge-purple" style={{ marginBottom: 'var(--space-3)' }}>
          {album.event.club.name}
        </span>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          {album.event.name}
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Album: <strong style={{ color: 'var(--color-text)' }}>{album.name}</strong>
          {' · '}
          {album.media.length} photo{album.media.length !== 1 ? 's' : ''}
        </p>

        {/* Sign-in prompt */}
        <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'rgba(124,111,239,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(124,111,239,0.2)', fontSize: '0.875rem' }}>
          <strong>Want to download photos or find your own?</strong>{' '}
          <Link href="/auth/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Create a free account →
          </Link>
        </div>
      </div>

      {/* Gallery grid — static render, no auth needed */}
      <div className="gallery-grid">
        {album.media.map((item) => {
          const src = item.thumbKey
            ? `${cdnUrl}/${item.thumbKey}`
            : `${cdnUrl}/${item.id}`;

          return (
            <article key={item.id} className="media-card">
              <Image
                src={src}
                alt={item.tags.join(', ') || 'Event photo'}
                fill
                sizes="(max-width: 768px) 160px, 280px"
                style={{ objectFit: 'cover' }}
                loading="lazy"
              />
              {item.tags.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                  }}
                >
                  {item.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
