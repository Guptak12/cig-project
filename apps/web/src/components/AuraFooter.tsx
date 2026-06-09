'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function AuraFooter() {
  const lineVariants = {
    hidden: { strokeDashoffset: 1000, fill: 'rgba(255, 255, 255, 0)' },
    visible: {
      strokeDashoffset: 0,
      fill: 'rgba(255, 255, 255, 0.05)',
      transition: {
        strokeDashoffset: { duration: 2, ease: 'easeInOut' as const },
        fill: { delay: 1.8, duration: 0.5, ease: 'easeOut' as const },
      },
    },
  };

  return (
    <footer
      style={{
        background: '#030303',
        borderTop: '1px solid var(--color-border)',
        paddingTop: 'var(--space-16)',
        paddingBottom: 'var(--space-12)',
        overflow: 'hidden',
      }}
    >
      <div className="container">
        {/* Footer links & branding grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-8)',
            marginBottom: 'var(--space-12)',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: 'var(--space-4)',
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              AURA
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: 280 }}>
              Sleek media intelligence platform for capturing, organizing, and discovering memories with AI.
            </p>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>
              EXPLORE
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li>
                <a href="/events" style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                  Clubs & Events
                </a>
              </li>
              <li>
                <a href="/my-photos" style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                  Facial Recognition Search
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>
              INTELLIGENCE
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li>
                <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                  AWS Rekognition Face Indexing
                </span>
              </li>
              <li>
                <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                  AI Scene & Object Auto-tagging
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Dynamic Massive SVG Line Drawing Logo */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '140px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            userSelect: 'none',
            pointerEvents: 'none',
            margin: 'var(--space-8) 0 var(--space-4)',
          }}
        >
          <svg
            viewBox="0 0 1000 200"
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '850px',
            }}
          >
            <motion.text
              x="50%"
              y="70%"
              textAnchor="middle"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={lineVariants}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '110px',
                fontWeight: 900,
                letterSpacing: '12px',
                stroke: 'rgba(255, 255, 255, 0.15)',
                strokeWidth: '1.2px',
                strokeDasharray: '1000',
              }}
            >
              AURA
            </motion.text>
          </svg>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            paddingTop: 'var(--space-6)',
            color: 'var(--color-text-subtle)',
            fontSize: '0.78rem',
          }}
        >
          <p>© 2026 Aura Platform. Event media intelligence for clubs.</p>
          <p>Cinematic Gallery System</p>
        </div>
      </div>
    </footer>
  );
}
