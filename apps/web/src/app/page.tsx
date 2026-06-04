'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { SpotlightCard } from '@/components/SpotlightCard';
import { Magnetic } from '@/components/Magnetic';
import { AISearchSimulation } from '@/components/AISearchSimulation';

export default function HomePage() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const, // premium snappy but smooth bezier
      },
    },
  };

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="hero" style={{ overflow: 'hidden', position: 'relative' }}>
        <motion.div
          className="container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '6px var(--space-4)',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#818cf8',
              marginBottom: 'var(--space-6)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            ✨ Aura Visual Intelligence
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.6rem, 7vw, 4.2rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              marginBottom: 'var(--space-5)',
              background: 'linear-gradient(135deg, #F8F9FA 30%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Every moment,
            <br />
            beautifully uncovered.
          </motion.h1>

          {/* Paragraph */}
          <motion.p
            variants={itemVariants}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.15rem',
              color: 'var(--color-text-muted)',
              maxWidth: 580,
              margin: '0 auto var(--space-10)',
              lineHeight: 1.7,
            }}
          >
            Upload event media files, search with face-matching intelligence, and 
            share secure public web galleries instantly — built strictly for modern clubs.
          </motion.p>

          {/* Action CTAs (Magnetic) */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              gap: 'var(--space-4)',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-6)',
            }}
          >
            <Magnetic>
              <Link
                href="/events"
                className="btn btn-primary"
                style={{
                  padding: '14px 32px',
                  fontSize: '0.98rem',
                  fontFamily: 'var(--font-heading)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                Browse Events →
              </Link>
            </Magnetic>

            <Magnetic>
              <Link
                href="/auth/register"
                className="btn btn-ghost"
                style={{
                  padding: '14px 32px',
                  fontSize: '0.98rem',
                  fontFamily: 'var(--font-heading)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                Join Platform
              </Link>
            </Magnetic>
          </motion.div>

          {/* Smart AI typing simulator */}
          <motion.div variants={itemVariants}>
            <AISearchSimulation />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Features (Scroll Assembly) ─── */}
      <section style={{ padding: 'var(--space-16) 0', background: '#07070a' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: 'var(--space-2)',
              }}
            >
              Intelligence Suite
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              Designed to handle volume media and instant search out-of-the-box.
            </p>
          </div>

          {/* Staggered load in view grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.08,
                },
              },
            }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={{
                  hidden: { opacity: 0, scale: 0.95, y: 20 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: { type: 'spring', stiffness: 100, damping: 15 },
                  },
                }}
              >
                <SpotlightCard
                  style={{
                    padding: 'var(--space-8)',
                    height: '100%',
                    background: 'var(--color-bg-card)',
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>{f.icon}</div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      marginBottom: 'var(--space-2)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {f.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                    {f.desc}
                  </p>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Footer CTA ─── */}
      <section
        style={{
          padding: 'var(--space-16) 0',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
          background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.04) 0%, transparent 60%)',
        }}
      >
        <div className="container">
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2.2rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-4)',
            }}
          >
            Find your shots instantly.
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)', maxWidth: '480px', margin: '0 auto var(--space-8)' }}>
            Simply upload a selfie to search all albums and uncover every single shot you are featured in, automatically.
          </p>
          <Magnetic>
            <Link
              href="/my-photos"
              className="btn btn-primary"
              style={{
                padding: '14px 36px',
                fontSize: '1rem',
                fontFamily: 'var(--font-heading)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              Search My Photos 🧑‍🤳
            </Link>
          </Magnetic>
        </div>
      </section>
    </>
  );
}

const features = [
  {
    icon: '📂',
    title: 'Event Albums',
    desc: 'All club events mapped to beautiful galleries. Sort albums, organize media folders, and manage memories cleanly.',
  },
  {
    icon: '✨',
    title: 'Facial Discovery',
    desc: 'Index a single reference selfie to immediately query and retrieve every photo containing your face using S3 & AWS Rekognition.',
  },
  {
    icon: '💧',
    title: 'Dynamic Watermarks',
    desc: 'Server-side watermarking system overlays club, event metadata, and photographer attribution instantly upon download.',
  },
  {
    icon: '🔗',
    title: 'QR Share Links',
    desc: 'Generate high-fidelity, secure QR code keys for public album distribution. No external accounts required to view public links.',
  },
  {
    icon: '🏷️',
    title: 'AI Tagging',
    desc: 'Unsupervised AWS Rekognition pipelines index tags (Indoor, Music, Night, etc.) on import, making search quick and powerful.',
  },
  {
    icon: '🔒',
    title: 'Fine Access Controls',
    desc: 'Manage private events and restrict photographer/admin access via robust role-based JWT session controls.',
  },
];
