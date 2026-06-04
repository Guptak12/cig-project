import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div>
        <div style={{ fontSize: '5rem', marginBottom: 'var(--space-4)' }}>🔍</div>
        <h1
          style={{
            fontSize: '4rem',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 'var(--space-3)',
          }}
        >
          404
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)', fontSize: '1.1rem' }}>
          This page doesn&apos;t exist.
        </p>
        <Link href="/" className="btn btn-primary">
          Go home →
        </Link>
      </div>
    </div>
  );
}
