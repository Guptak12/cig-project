'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';

/**
 * Top navigation bar — fixed, glassmorphism, AURA branding.
 */
export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push('/');
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <nav
      className="navbar"
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-8)',
        background: 'rgba(5, 5, 5, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <Link
        href="/"
        className="navbar-logo"
        aria-label="AURA home"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.4rem',
          fontWeight: 800,
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.03em',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        ✨ AURA
      </Link>

      <ul className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'var(--space-8)' }}>
        <li>
          <Link
            href="/events"
            className={`navbar-link ${isActive('/events') ? 'active' : ''}`}
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              fontSize: '0.9rem',
              color: isActive('/events') ? 'var(--color-text)' : 'var(--color-text-muted)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              transition: 'color 0.2s, background 0.2s',
            }}
          >
            Events
          </Link>
        </li>
        {user && (
          <li>
            <Link
              href="/my-photos"
              className={`navbar-link ${isActive('/my-photos') ? 'active' : ''}`}
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                fontSize: '0.9rem',
                color: isActive('/my-photos') ? 'var(--color-text)' : 'var(--color-text-muted)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                transition: 'color 0.2s, background 0.2s',
              }}
            >
              My Photos
            </Link>
          </li>
        )}
        {(user?.role === 'ADMIN' || user?.role === 'PHOTOGRAPHER') && (
          <li>
            <Link
              href="/upload"
              className={`navbar-link ${isActive('/upload') ? 'active' : ''}`}
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                fontSize: '0.9rem',
                color: isActive('/upload') ? 'var(--color-text)' : 'var(--color-text-muted)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                transition: 'color 0.2s, background 0.2s',
              }}
            >
              Upload
            </Link>
          </li>
        )}
      </ul>

      <div className="navbar-actions">
        {isLoading ? (
          <div className="spinner" aria-label="Loading" />
        ) : user ? (
          <>
            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontWeight: 500,
              }}
            >
              <span
                className={`badge ${
                  user.role === 'ADMIN'
                    ? 'badge-amber'
                    : user.role === 'PHOTOGRAPHER'
                      ? 'badge-pink'
                      : 'badge-purple'
                }`}
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                }}
              >
                {user.role}
              </span>
              {user.name}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              style={{
                borderColor: 'var(--color-border)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--color-text-muted)',
                fontSize: '0.8rem',
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="btn btn-ghost btn-sm"
              style={{ borderColor: 'var(--color-border)', fontSize: '0.8rem' }}
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            >
              Join Aura
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
