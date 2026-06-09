import Link from 'next/link';

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function PendingApprovalPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 520, padding: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>⏳</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
            Account pending approval
          </h1>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            {email ? (
              <>
                The account for <strong>{email}</strong> has been created and is waiting for an admin to approve it.
                You will not be able to log in until that approval is completed.
              </>
            ) : (
              <>
                Your account has been created and is waiting for an admin to approve it.
                You will not be able to log in until that approval is completed.
              </>
            )}
          </p>

          <div style={{ marginTop: 'var(--space-6)' }}>
            <Link href="/auth/login" className="btn btn-primary">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
