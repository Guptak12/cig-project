'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { api } from '@/lib/api';

interface Props {
  albumId: string;
  albumName: string;
}

/**
 * QR share button + modal.
 * Lazily fetches/creates a share token and renders a QR code on demand.
 */
export function QRShareButton({ albumId, albumName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function openModal() {
    setIsOpen(true);
    if (qrDataUrl) return; // already generated

    setIsLoading(true);
    try {
      const data = await api.albums.getQr(albumId);
      setShareUrl(data.shareUrl);

      const dataUrl = await QRCode.toDataURL(data.shareUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#f0f0f8', light: '#13131a' },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('[QR]', err);
    } finally {
      setIsLoading(false);
    }
  }

  function close() {
    setIsOpen(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={openModal} aria-label="Share album via QR code">
        🔗 Share
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal
          aria-label={`Share ${albumName}`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            padding: 'var(--space-6)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div
            className="card"
            style={{
              padding: 'var(--space-8)',
              width: '100%',
              maxWidth: 360,
              textAlign: 'center',
            }}
          >
            <button
              onClick={close}
              style={{
                position: 'absolute',
                top: 'var(--space-4)',
                right: 'var(--space-4)',
                color: 'var(--color-text-muted)',
                fontSize: '1.2rem',
              }}
              aria-label="Close"
            >
              ✕
            </button>

            <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>Share Album</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--space-6)' }}>
              {albumName}
            </p>

            {isLoading ? (
              <div className="spinner" style={{ margin: '40px auto' }} />
            ) : qrDataUrl ? (
              <>
                <img
                  src={qrDataUrl}
                  alt="QR code for album share"
                  style={{
                    width: 200,
                    height: 200,
                    margin: '0 auto var(--space-6)',
                    borderRadius: 'var(--radius-md)',
                    display: 'block',
                  }}
                />
                <button
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={copyLink}
                >
                  {copied ? '✓ Copied!' : '📋 Copy Link'}
                </button>
              </>
            ) : (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>Failed to generate QR code.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
