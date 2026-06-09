'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { AISearchSimulation } from '@/components/AISearchSimulation';
import { Magnetic } from '@/components/Magnetic';
import { SpotlightCard } from '@/components/SpotlightCard';

const ease = [0.16, 1, 0.3, 1] as const;

const heroFrames = [
  {
    title: 'Cultural Fest',
    meta: '2,418 assets',
    img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=85&w=900',
  },
  {
    title: 'Mountain Trip',
    meta: '842 assets',
    img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=85&w=900',
  },
  {
    title: 'Robotics Workshop',
    meta: '318 assets',
    img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=85&w=900',
  },
  {
    title: 'Sports Meet',
    meta: '1,206 assets',
    img: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&q=85&w=900',
  },
];

const events = [
  {
    name: 'Cultural Night 2026',
    category: 'Cultural',
    date: '24 Feb',
    privacy: 'Public',
    assets: '2.4K',
    tags: ['stage', 'crowd', 'dance'],
    img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=85&w=800',
  },
  {
    name: 'Himalayan Photo Walk',
    category: 'Trip',
    date: '18 Mar',
    privacy: 'Private',
    assets: '842',
    tags: ['mountains', 'portraits', 'travel'],
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=85&w=800',
  },
  {
    name: 'Founders Workshop',
    category: 'Workshop',
    date: '03 Apr',
    privacy: 'Members',
    assets: '318',
    tags: ['indoor', 'speaker', 'team'],
    img: 'https://images.unsplash.com/photo-1559223607-a43c990c692c?auto=format&fit=crop&q=85&w=800',
  },
  {
    name: 'Inter-Club Finals',
    category: 'Sports',
    date: '11 Apr',
    privacy: 'Public',
    assets: '1.2K',
    tags: ['sports', 'field', 'action'],
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&q=85&w=800',
  },
  {
    name: 'Farewell Party',
    category: 'Party',
    date: '02 May',
    privacy: 'Private',
    assets: '936',
    tags: ['friends', 'night', 'portraits'],
    img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=85&w=800',
  },
  {
    name: 'Design Competition',
    category: 'Competition',
    date: '16 May',
    privacy: 'Members',
    assets: '510',
    tags: ['jury', 'projects', 'awards'],
    img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=85&w=800',
  },
];

const capabilities = [
  ['01', 'Event-wise command center', 'Create events, attach albums, sort by name, category, or date, and keep descriptions, club metadata, and visibility rules together.'],
  ['02', 'Bulk media ingestion', 'Drag photos and videos into the upload queue, preview files before publishing, then hand originals to cloud storage through presigned URLs.'],
  ['03', 'Access and roles', 'Admins, photographers, club members, and viewers get different routes through public albums, private galleries, downloads, and upload rights.'],
  ['04', 'Social media layer', 'Likes, comments, shares, downloads, favourites, user tags, and notification surfaces make the archive feel alive after the event ends.'],
  ['05', 'AI visual indexing', 'Scene tags, event search, uploader filters, upload-date search, and facial discovery turn scattered media into a searchable memory graph.'],
];

const workflow = [
  ['Ingest', 'Photographers upload folders directly to album queues.'],
  ['Classify', 'AI tags scenes, faces, people density, objects, and event context.'],
  ['Govern', 'Private media stays behind role checks and signed URLs.'],
  ['Engage', 'Members react, comment, tag friends, download, and share.'],
];

export default function HomePage() {
  const [scanActive, setScanActive] = useState(false);
  const [liked, setLiked] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end end'],
  });

  // Zoom-hero transformations (Clamped to avoid extrapolation artifact at high scrolls)
  const textOpacity = useTransform(scrollYProgress, [0, 0.18, 1], [1, 0, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.2, 1], [0, -120, -120]);
  const textScale = useTransform(scrollYProgress, [0, 0.18, 1], [1, 0.92, 0.92]);
  const textPointerEvents = useTransform(scrollYProgress, (v) => (v > 0.18 ? 'none' : 'auto'));

  const centerScale = useTransform(scrollYProgress, [0, 1], [0.8, 3.2]);
  const centerBorderRadius = useTransform(scrollYProgress, [0.75, 1], ['20px', '0px']);
  const captionOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const secondaryScale = useTransform(scrollYProgress, [0, 0.75], [0.85, 0.35]);
  const secondaryOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  // Secondary float card translations (Symmetric 4 Cards)
  const card1X = useTransform(scrollYProgress, [0, 0.8], [0, -180]);
  const card1Y = useTransform(scrollYProgress, [0, 0.8], [0, -120]);

  const card2X = useTransform(scrollYProgress, [0, 0.8], [0, 180]);
  const card2Y = useTransform(scrollYProgress, [0, 0.8], [0, -120]);

  const card3X = useTransform(scrollYProgress, [0, 0.8], [0, -180]);
  const card3Y = useTransform(scrollYProgress, [0, 0.8], [0, 120]);

  const card4X = useTransform(scrollYProgress, [0, 0.8], [0, 180]);
  const card4Y = useTransform(scrollYProgress, [0, 0.8], [0, 120]);

  // Translate entire cards wrapper up/down as we scroll to keep spacing clean and prevent overlap
  const wrapperY = useTransform(scrollYProgress, [0, 0.65, 1], [280, 0, 0]);

  const videoOverlayOpacity = useTransform(scrollYProgress, [0.55, 0.9], [0, 0.65]);

  const cueOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const cueY = useTransform(scrollYProgress, [0, 0.15], [0, 20]);

  return (
    <>
      <section ref={heroRef} className="hero-scroll-track">
        <div className="hero-sticky-container">
          <div className="hero-noise" aria-hidden />

          {/* Text/Heading Overlay */}
          <motion.div
            className="zoom-hero-text"
            style={{
              opacity: textOpacity,
              y: textY,
              scale: textScale,
              pointerEvents: textPointerEvents as any,
            }}
          >
            <p className="eyebrow">Event media intelligence for clubs</p>
            <h1>Event albums that find every face, tag, and moment.</h1>
            <p className="hero-lede">
              Aura centralizes photos and videos from photographers, organizers, and members into secure,
              searchable, social galleries built for college clubs and societies.
            </p>
            <div className="hero-actions">
              <Magnetic>
                <Link href="/upload" className="btn btn-primary hero-cta">
                  Upload media
                </Link>
              </Magnetic>
              <Link href="/events" className="btn btn-ghost hero-cta">
                Browse events
              </Link>
            </div>
            <div className="hero-search">
              <span>Smart search</span>
              <strong>Photos of me at Cultural Fest with stage lights</strong>
            </div>
          </motion.div>

          {/* Animated Interactive Grid */}
          <motion.div
            className="zoom-hero-content-wrapper"
            style={{ y: wrapperY }}
          >
            {/* Secondary Card 1: Mountain Trip */}
            <motion.article
              className="zoom-hero-float-card zoom-card-1"
              style={{
                scale: secondaryScale,
                opacity: secondaryOpacity,
                x: card1X,
                y: card1Y,
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=85&w=600"
                alt="Mountain trip cover"
              />
              <div>
                <strong>Mountain Trip</strong>
                <span>842 assets</span>
              </div>
            </motion.article>

            {/* Secondary Card 2: Robotics Workshop */}
            <motion.article
              className="zoom-hero-float-card zoom-card-2"
              style={{
                scale: secondaryScale,
                opacity: secondaryOpacity,
                x: card2X,
                y: card2Y,
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=85&w=600"
                alt="Robotics workshop cover"
              />
              <div>
                <strong>Robotics Workshop</strong>
                <span>318 assets</span>
              </div>
            </motion.article>

            {/* Central Zoom Video: Cultural Fest */}
            <motion.article
              className="zoom-hero-center-card"
              style={{
                scale: centerScale,
                borderRadius: centerBorderRadius,
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=85&w=900"
                alt="Cultural fest cover"
              />
              <motion.div
                className="zoom-hero-video-overlay"
                style={{ opacity: videoOverlayOpacity }}
              />
              <motion.div className="card-caption" style={{ opacity: captionOpacity }}>
                <strong>Cultural Fest</strong>
                <span>2,418 assets</span>
              </motion.div>
            </motion.article>

            {/* Secondary Card 3: Sports Meet */}
            <motion.article
              className="zoom-hero-float-card zoom-card-3"
              style={{
                scale: secondaryScale,
                opacity: secondaryOpacity,
                x: card3X,
                y: card3Y,
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&q=85&w=600"
                alt="Sports meet cover"
              />
              <div>
                <strong>Sports Meet</strong>
                <span>1,206 assets</span>
              </div>
            </motion.article>

            {/* Secondary Card 4: Farewell Party */}
            <motion.article
              className="zoom-hero-float-card zoom-card-4"
              style={{
                scale: secondaryScale,
                opacity: secondaryOpacity,
                x: card4X,
                y: card4Y,
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=85&w=600"
                alt="Farewell party cover"
              />
              <div>
                <strong>Farewell Party</strong>
                <span>936 assets</span>
              </div>
            </motion.article>
          </motion.div>

          <motion.div
            className="hero-scroll-cue"
            style={{ opacity: cueOpacity, y: cueY }}
            aria-hidden
          >
            <span>Scroll to discover</span>
            <i />
          </motion.div>
        </div>

        {/* Glassmorphic Parallax Capabilities Overlay */}
        <div className="capabilities-scroll-overlay">
          <div className="container capabilities-overlay-content">
            <div className="capabilities-overlay-heading">
              <p className="eyebrow">What the platform supports</p>
              <h2>From scattered drives to a governed media system.</h2>
              <p>
                Built around the problem statement: event management, uploads, RBAC, social interaction,
                AI tagging, advanced search, and facial recognition.
              </p>
            </div>
            <div className="capability-list">
              {capabilities.map(([number, title, body]) => (
                <motion.article
                  key={title}
                  className="capability-row"
                  initial={{ opacity: 0.35, y: 16, borderColor: "rgba(244, 240, 229, 0.05)" }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    borderColor: "rgba(244, 240, 229, 0.20)",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                  }}
                  viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
                  transition={{ duration: 0.5, ease: ease }}
                >
                  <span className="capability-num">{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container section-heading split">
          <div>
            <p className="eyebrow">Recent events</p>
            <h2>Albums assemble like a living media wall.</h2>
          </div>
          <p>
            The gallery prioritizes covers, privacy state, metadata, and AI tags so members can scan quickly and
            organizers can keep large media libraries under control.
          </p>
        </div>
        <motion.div
          className="container event-masonry"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {events.map((event, index) => (
            <motion.div
              key={event.name}
              variants={{
                hidden: { opacity: 0, y: 24, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.65, ease } },
              }}
              className={index % 3 === 1 ? 'masonry-tall' : ''}
            >
              <SpotlightCard className="event-tile">
                <img src={event.img} alt={`${event.name} album cover`} />
                <div className="event-tile-gradient" />
                <div className="event-tile-top">
                  <span>{event.category}</span>
                  <span>{event.privacy}</span>
                </div>
                <div className="event-tile-bottom">
                  <p>{event.date} / {event.assets} assets</p>
                  <h3>{event.name}</h3>
                  <div className="tag-rail">
                    {event.tags.map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="section-band">
        <div className="container product-demo">
          <div className="demo-panel upload-panel">
            <p className="eyebrow">Photographer flow</p>
            <h2>Bulk upload, preview, classify.</h2>
            <div className="drop-preview">
              <div className="drop-preview-icon">+</div>
              <strong>Drop event folder</strong>
              <span>Photos, videos, RAW exports</span>
            </div>
            <div className="upload-queue">
              {['IMG_2401.jpg', 'dance_reel.mp4', 'group_portrait.webp'].map((file, index) => (
                <div key={file}>
                  <span>{file}</span>
                  <i style={{ width: `${64 + index * 13}%` }} />
                </div>
              ))}
            </div>
          </div>

          <div className="demo-panel ai-panel">
            <p className="eyebrow">Member flow</p>
            <h2>Find me across every album.</h2>
            <button className="scan-button" onClick={() => setScanActive((value) => !value)}>
              {scanActive ? 'Stop scan' : 'Find my photos'}
            </button>
            <div className={`scan-grid ${scanActive ? 'is-scanning' : ''}`}>
              {events.slice(0, 6).map((event) => (
                <img key={event.name} src={event.img} alt="" />
              ))}
              {scanActive && <div className="scanner-line" />}
            </div>
          </div>

          <div className="demo-panel social-panel">
            <p className="eyebrow">Social layer</p>
            <h2>React, tag, comment, share.</h2>
            <div className="social-photo">
              <img src={events[0].img} alt="Cultural event interaction preview" />
              <div>
                <button onClick={() => setLiked((value) => !value)} aria-label="Like photo">
                  <motion.span
                    animate={{ scale: liked ? [1, 0.8, 1.3, 1] : 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    {liked ? '♥' : '♡'}
                  </motion.span>
                  {liked ? '129' : '128'}
                </button>
                <button>Comment</button>
                <button>Share</button>
              </div>
            </div>
            <AnimatePresence>
              {liked && (
                <motion.p
                  className="notification-toast"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  Notification sent: someone liked your photo.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section className="section-band darker">
        <div className="container workflow-section">
          <div className="section-heading">
            <p className="eyebrow">How Aura works</p>
            <h2>Four stages from event chaos to searchable memory.</h2>
          </div>
          <div className="workflow-grid">
            {workflow.map(([title, body], index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.6, ease }}
              >
                <span>{index + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band ai-search-band">
        <div className="container section-heading">
          <p className="eyebrow">AI smart search simulation</p>
          <h2>Natural language queries become filtered media results.</h2>
        </div>
        <AISearchSimulation />
      </section>

      <section className="final-cta">
        <div className="container">
          <p className="eyebrow">Production-ready frontend shell</p>
          <h2>Start with the interface, then connect the cloud secrets.</h2>
          <p>
            The next production step is configuring API, CDN, S3, Rekognition, database, Redis, and auth
            environment variables before deploying the web and API services.
          </p>
          <div className="hero-actions">
            <Link href="/auth/register" className="btn btn-primary hero-cta">
              Create workspace
            </Link>
            <Link href="/events" className="btn btn-ghost hero-cta">
              View galleries
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

const floatIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};
