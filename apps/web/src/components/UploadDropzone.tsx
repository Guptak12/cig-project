'use client';

import { useRef, useState } from 'react';

interface Props {
  albumId: string;
  onUploadComplete?: () => void;
}

interface UploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

/**
 * Drag-and-drop upload dropzone.
 * Uses the presigned S3 URL flow: presign → direct PUT to S3 → confirm.
 * No media ever passes through the API server.
 */
export function UploadDropzone({ albumId, onUploadComplete }: Props) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: FileList | File[]) {
    const imageFiles = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => [
      ...prev,
      ...imageFiles.map((file) => ({ file, status: 'pending' as const, progress: 0 })),
    ]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  async function uploadFile(index: number) {
    const entry = files[index];
    if (!entry || entry.status !== 'pending') return;

    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: 'uploading' } : f)),
    );

    try {
      const token = localStorage.getItem('auth-token');

      // Step 1: get presigned URL
      const presignRes = await fetch(`/api/v1/albums/${albumId}/media/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileName: entry.file.name, contentType: entry.file.type, albumId }),
      });

      if (!presignRes.ok) throw new Error('Failed to get upload URL');
      const { data: presignData } = await presignRes.json();

      // Step 2: PUT directly to S3
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, progress: pct } : f)));
          }
        };
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error('Upload failed')));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('PUT', presignData.uploadUrl);
        xhr.setRequestHeader('Content-Type', entry.file.type);
        xhr.send(entry.file);
      });

      // Step 3: confirm upload → triggers background job
      await fetch(`/api/v1/albums/${albumId}/media/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ s3Key: presignData.s3Key, albumId }),
      });

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'done', progress: 100 } : f)),
      );

      onUploadComplete?.();
    } catch (err) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'error', error: (err as Error).message } : f,
        ),
      );
    }
  }

  async function uploadAll() {
    const pending = files.map((_, i) => i).filter((i) => files[i].status === 'pending');
    // Upload in batches of 3 for concurrency
    for (let i = 0; i < pending.length; i += 3) {
      await Promise.all(pending.slice(i, i + 3).map((idx) => uploadFile(idx)));
    }
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length;

  return (
    <div>
      {/* Drop area */}
      <div
        className={`dropzone ${isDragging ? 'drag-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        role="button"
        tabIndex={0}
        aria-label="Click or drag photos here to upload"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📸</div>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
          Drop photos here
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          or click to browse — JPEG, PNG, WEBP
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          aria-hidden
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <p style={{ fontWeight: 600 }}>{files.length} photo{files.length !== 1 ? 's' : ''} selected</p>
            {pendingCount > 0 && (
              <button className="btn btn-primary btn-sm" onClick={uploadAll}>
                Upload {pendingCount} photo{pendingCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {files.map((entry, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--color-bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span style={{ fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.file.name}
                </span>

                {entry.status === 'uploading' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div
                      style={{
                        width: 80,
                        height: 4,
                        background: 'var(--color-border)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${entry.progress}%`,
                          background: 'var(--gradient-primary)',
                          transition: 'width 0.2s',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{entry.progress}%</span>
                  </div>
                )}
                {entry.status === 'done' && <span style={{ color: 'var(--color-success)' }}>✓</span>}
                {entry.status === 'error' && (
                  <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{entry.error}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
