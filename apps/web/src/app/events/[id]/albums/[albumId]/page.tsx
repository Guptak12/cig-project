import type { Metadata } from 'next';
import Link from 'next/link';
import { InfiniteGallery } from '@/components/InfiniteGallery';
import { DeleteAlbumButton } from '@/components/DeleteAlbumButton';

interface Props {
  params: Promise<{ id: string; albumId: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { albumId } = await params;
  return {
    title: `Album ${albumId}`,
    description: 'Browse event photos in this album.',
  };
}

export default async function AlbumPage({ params }: Props) {
  const { id, albumId } = await params;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  // Fetch event info for breadcrumb
  let eventName = 'Event';
  try {
    const res = await fetch(`${apiUrl}/events/${id}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      eventName = json.data?.name ?? 'Event';
    }
  } catch {
    // Non-blocking — breadcrumb degrades gracefully
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-8)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        <Link href="/events" style={{ color: 'var(--color-text-muted)' }}>Events</Link>
        <span>›</span>
        <Link href={`/events/${id}`} style={{ color: 'var(--color-text-muted)' }}>{eventName}</Link>
        <span>›</span>
        <span style={{ color: 'var(--color-text)' }}>Album</span>
      </nav>

      {/* Gallery — client component handles auth + infinite scroll */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-6)' }}>
        <DeleteAlbumButton albumId={albumId} eventId={id} />
      </div>

      <InfiniteGallery albumId={albumId} />
    </div>
  );
}
