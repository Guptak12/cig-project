'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UploadDropzone } from '@/components/UploadDropzone';
import { api, type Event } from '@/lib/api';

export default function UploadPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [uploadCount, setUploadCount] = useState(0);

  // Redirect if not photographer/admin
  useEffect(() => {
    if (!authLoading && user && user.role === 'MEMBER') {
      return;
    }
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    api.events.list().then(setEvents).catch(() => setEvents([]));
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const albums = selectedEvent?.albums ?? [];

  if (authLoading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', maxWidth: 720 }}>
      <header style={{ marginBottom: 'var(--space-10)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
          Upload Photos
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Select an event and album, then drop your photos. They&apos;ll be tagged and processed automatically.
        </p>
      </header>

      {/* Event & Album selectors */}
      <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label htmlFor="upload-event" className="form-label">Event</label>
            <select
              id="upload-event"
              className="input"
              value={selectedEventId}
              onChange={(e) => { setSelectedEventId(e.target.value); setSelectedAlbumId(''); }}
              style={{ appearance: 'none' }}
            >
              <option value="">Select event…</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="upload-album" className="form-label">Album</label>
            <select
              id="upload-album"
              className="input"
              value={selectedAlbumId}
              onChange={(e) => setSelectedAlbumId(e.target.value)}
              disabled={!selectedEventId}
              style={{ appearance: 'none' }}
            >
              <option value="">Select album…</option>
              {albums.map((al) => (
                <option key={al.id} value={al.id}>{al.name}</option>
              ))}
            </select>
          </div>
        </div>

        {uploadCount > 0 && (
          <div
            style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'rgba(52,211,153,0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(52,211,153,0.2)',
              fontSize: '0.875rem',
              color: 'var(--color-success)',
            }}
          >
            ✓ {uploadCount} photo{uploadCount !== 1 ? 's' : ''} uploaded successfully — AI tagging in progress…
          </div>
        )}
      </div>

      {/* Dropzone — only active when album is selected */}
      {selectedAlbumId ? (
        <UploadDropzone
          albumId={selectedAlbumId}
          onUploadComplete={() => setUploadCount((n) => n + 1)}
        />
      ) : (
        <div
          className="dropzone"
          style={{ opacity: 0.4, pointerEvents: 'none', cursor: 'default' }}
          aria-disabled
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>📸</div>
          <p style={{ fontWeight: 600 }}>Select an event and album above to enable upload</p>
        </div>
      )}
    </div>
  );
}
