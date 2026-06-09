'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, type MyPhoto } from '@/lib/api';
import { buildMediaUrl } from '@/lib/media-url';
import { downloadMedia } from '@/lib/download-media';
import { SpotlightCard } from '@/components/SpotlightCard';

export default function MyPhotosPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [photos, setPhotos] = useState<MyPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFaceId, setHasFaceId] = useState(false);
  const [selfieUploading, setSelfieUploading] = useState(false);
  const [selfieError, setSelfieError] = useState('');
  const [selfieSuccess, setSelfieSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL ?? '';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  useEffect(() => {
    if (!user) return;
    loadMyPhotos();
    // Check if user already has a face indexed
    api.users.me().then((u) => setHasFaceId(Boolean(u.faceId)));
  }, [user]);

  async function loadMyPhotos() {
    setIsLoading(true);
    try {
      const result = await api.users.myPhotos();
      setPhotos(result);
    } catch {
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function uploadSelfie(file: File) {
    setSelfieUploading(true);
    setSelfieError('');
    setSelfieSuccess(false);

    try {
      const token = localStorage.getItem('cig-token');
      const formData = new FormData();
      formData.append('selfie', file);

      const res = await fetch(`${apiUrl}/users/selfie`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error);

      setHasFaceId(true);
      setSelfieSuccess(true);
      await loadMyPhotos();
    } catch (err) {
      setSelfieError((err as Error).message);
    } finally {
      setSelfieUploading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
        <div className="empty-state">
          <p style={{ marginBottom: 'var(--space-5)' }}>Sign in to find your photos.</p>
          <Link href="/auth/login" className="btn btn-primary">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      <header style={{ marginBottom: 'var(--space-10)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
          Face Discovery
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          AI-driven instant facial recognition. Scan your face once, find all matching photos immediately.
        </p>
      </header>

      {/* Selfie setup card */}
      <SpotlightCard
        style={{
          padding: 'var(--space-8)',
          marginBottom: 'var(--space-10)',
          background: hasFaceId ? 'rgba(99, 102, 241, 0.03)' : 'var(--gradient-card)',
          borderColor: hasFaceId ? 'rgba(99, 102, 241, 0.2)' : 'var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {hasFaceId ? (
                <>Reference Selfie Indexed</>
              ) : (
                <>Upload Reference Selfie</>
              )}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {hasFaceId
                ? 'Your face is indexed. AWS Rekognition checks all uploaded event albums and displays matches automatically below.'
                : 'Provide a clear selfie. We will build a customized facial map to crawl and retrieve your event photos.'}
            </p>
            {selfieError && <p className="form-error" style={{ marginTop: 'var(--space-3)' }}>{selfieError}</p>}
            {selfieSuccess && (
              <p style={{ color: 'var(--color-primary)', fontSize: '0.875rem', marginTop: 'var(--space-3)', fontWeight: 600 }}>
                ✓ Selfie indexed successfully! Scanning completed.
              </p>
            )}
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="user"
              className="sr-only"
              aria-label="Upload selfie"
              onChange={(e) => e.target.files?.[0] && uploadSelfie(e.target.files[0])}
            />
            <button
              className={`btn ${hasFaceId ? 'btn-ghost' : 'btn-primary'}`}
              onClick={() => fileRef.current?.click()}
              disabled={selfieUploading}
              style={{
                fontFamily: 'var(--font-heading)',
                boxShadow: hasFaceId ? 'none' : 'var(--shadow-glow)',
              }}
            >
              {selfieUploading ? (
                <><span className="spinner" /> Indexing Face…</>
              ) : hasFaceId ? (
                'Update Reference'
              ) : (
                'Take Selfie'
              )}
            </button>
          </div>
        </div>
      </SpotlightCard>

      {/* Dynamic Scan Line & Photo results */}
      {selfieUploading ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', fontWeight: 600, marginBottom: 'var(--space-4)', letterSpacing: '0.05em' }}>
            ⚡ SCANNING EVENT GALLERIES...
          </p>
          <div className="scanner-container" style={{ borderRadius: 'var(--radius-lg)', background: '#0e0e13', padding: 'var(--space-4)' }}>
            <div className="scanner-line" />
            <div className="gallery-grid" style={{ filter: 'blur(4px)', opacity: 0.35 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="gallery-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)' }}>
            {hasFaceId
              ? 'No photos found yet. Photos where you are discovered will show up here dynamically.'
              : 'Upload a reference selfie above to begin face-matching query.'}
          </p>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--space-5)' }}>
            Discovered <strong style={{ color: 'var(--color-text)' }}>{photos.length}</strong> photo{photos.length !== 1 ? 's' : ''} containing your face
          </p>
          <div className="gallery-grid">
            {photos.map((photo) => {
              const src = photo.thumbKey
                ? buildMediaUrl(cdnUrl, 'thumbs', photo.thumbKey)
                : buildMediaUrl(cdnUrl, 'originals', photo.s3Key);
              return (
                <article key={photo.id} className="media-card" style={{ borderRadius: 'var(--radius-md)' }}>
                  <Image
                    src={src}
                    alt="Photo featuring you"
                    fill
                    sizes="(max-width: 768px) 160px, 280px"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <div className="media-card-overlay">
                    <div className="media-card-actions">
                      <button
                        onClick={() => downloadMedia(photo.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', width: '100%', justifyContent: 'center' }}
                        aria-label="Download"
                      >
                        ↓ Download
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
