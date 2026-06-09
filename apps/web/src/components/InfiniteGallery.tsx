'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from './SpotlightCard';

interface MediaItem {
  id: string;
  thumbKey: string | null;
  s3Key: string;
  tags: string[];
  _count: { reactions: number; comments: number };
  uploadedBy: { id: string; name: string };
}

interface Props {
  albumId: string;
  thumbBaseUrl: string; // CloudFront base URL for public thumbs
}

const PAGE_SIZE = 24;

export function InfiniteGallery({ albumId, thumbBaseUrl }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    async (cursor?: string) => {
      if (isLoading) return;
      setIsLoading(true);

      try {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
        if (cursor) params.set('cursor', cursor);

        const token = localStorage.getItem('auth-token');
        const res = await fetch(`/api/v1/albums/${albumId}/media?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch media');

        const json = await res.json();
        const { items: newItems, nextCursor: newCursor } = json.data;

        setItems((prev) => (cursor ? [...prev, ...newItems] : newItems));
        setNextCursor(newCursor);
        setHasMore(Boolean(newCursor));
      } catch (err) {
        console.error('[gallery] Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [albumId, isLoading],
  );

  // Initial load
  useEffect(() => {
    fetchPage();
  }, [albumId]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && nextCursor) {
          fetchPage(nextCursor);
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, nextCursor, fetchPage]);

  if (items.length === 0 && !isLoading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🖼️</div>
        <p>No photos in this album yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="gallery-grid">
        {items.map((item) => (
          <GalleryCard key={item.id} item={item} thumbBaseUrl={thumbBaseUrl} />
        ))}

        {/* Skeleton placeholders while loading */}
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skel-${i}`}
              className="skeleton"
              style={{ aspectRatio: '1', borderRadius: 'var(--radius-md)' }}
            />
          ))}
      </div>

      {/* Scroll sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />

      {!hasMore && items.length > 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', padding: 'var(--space-8)' }}>
          You've seen all {items.length} photos ✓
        </p>
      )}
    </>
  );
}

// ─── Individual card ───

function GalleryCard({ item, thumbBaseUrl }: { item: MediaItem; thumbBaseUrl: string }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item._count.reactions);
  const [isHovered, setIsHovered] = useState(false);

  const thumbUrl = item.thumbKey
    ? `${thumbBaseUrl}/${item.thumbKey}`
    : `${thumbBaseUrl}/${item.s3Key}`;

  function handleLike() {
    setIsLiked((prev) => {
      const next = !prev;
      setLikeCount((c) => (next ? c + 1 : c - 1));
      return next;
    });
  }

  return (
    <SpotlightCard
      className="media-card"
      style={{
        borderRadius: 'var(--radius-md)',
        aspectRatio: '1',
      }}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      >
        <Image
          src={thumbUrl}
          alt={item.tags.join(', ') || 'Event photo'}
          fill
          sizes="(max-width: 768px) 160px, 280px"
          style={{
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
          loading="lazy"
        />

        {/* Cinematic gradient overlay & metadata */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
            opacity: isHovered ? 1 : 0.6,
            transition: 'opacity 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 'var(--space-4)',
          }}
        >
          {/* Tag Hover Reveal (smoothly slide out horizontally from behind metadata) */}
          <div style={{ overflow: 'hidden', marginBottom: 'var(--space-2)' }}>
            <AnimatePresence>
              {isHovered && item.tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}
                >
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="badge badge-purple"
                      style={{
                        fontSize: '0.68rem',
                        background: 'rgba(244, 240, 231, 0.16)',
                        color: '#e6ddcb',
                        border: '1px solid rgba(244, 240, 231, 0.18)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {/* Heart Pop Animation */}
            <button
              onClick={handleLike}
              className="btn btn-ghost btn-sm"
              style={{
                color: isLiked ? '#f43f5e' : '#fff',
                borderColor: isLiked ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255,255,255,0.2)',
                background: isLiked ? 'rgba(244, 63, 94, 0.1)' : 'rgba(5, 5, 5, 0.4)',
                padding: '4px 10px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              aria-label="Like"
            >
              <motion.span
                animate={{ scale: isLiked ? [1, 0.8, 1.4, 1] : 1 }}
                transition={{ duration: 0.4 }}
                style={{ display: 'inline-block' }}
              >
                ❤️
              </motion.span>
              <span>{likeCount}</span>
            </button>

            <button
              className="btn btn-ghost btn-sm"
              style={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.2)',
                background: 'rgba(5, 5, 5, 0.4)',
                padding: '4px 10px',
                fontSize: '0.8rem',
              }}
              aria-label="Comments"
            >
              💬 {item._count.comments}
            </button>

            <a
              href={`/api/v1/media/${item.id}/download`}
              download
              className="btn btn-ghost btn-sm"
              style={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.2)',
                background: 'rgba(5, 5, 5, 0.4)',
                marginLeft: 'auto',
                padding: '4px 8px',
              }}
              aria-label="Download photo"
            >
              ↓
            </a>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}
