'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AISearchSimulation() {
  const [typedText, setTypedText] = useState('');
  const [step, setStep] = useState(0); // 0: typing, 1: flashing, 2: results revealed
  const targetText = "Photos of me dancing at the Cultural Fest 2023...";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < targetText.length) {
        setTypedText((prev) => prev + targetText.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        // Step 1: Flash border
        setStep(1);
        setTimeout(() => {
          // Step 2: Show results
          setStep(2);
        }, 1000);
      }
    }, 45); // ~40ms per character

    return () => clearInterval(interval);
  }, []);

  const mockPhotos = [
    { id: 1, tag: '#cultural', src: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400' },
    { id: 2, tag: '#dancing', src: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400' },
    { id: 3, tag: '#fest', src: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400' },
    { id: 4, tag: '#happy', src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400' },
  ];

  return (
    <div
      style={{
        maxWidth: '580px',
        margin: 'var(--space-10) auto 0',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-lg)',
        background: '#0d0d12',
        border: step === 1 ? '1.5px solid var(--color-primary)' : '1.5px solid rgba(255, 255, 255, 0.05)',
        boxShadow: step === 1 ? '0 0 20px rgba(244, 240, 231, 0.22)' : 'none',
        transition: 'all 0.4s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          fontSize: '0.9rem',
          color: 'var(--color-text)',
          fontFamily: 'var(--font-sans)',
          marginBottom: 'var(--space-4)',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>SEARCH</span>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {typedText}
          {step === 0 && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              style={{
                width: '2px',
                height: '15px',
                background: 'var(--color-primary)',
                marginLeft: '2px',
              }}
            />
          )}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--color-primary)',
            background: 'rgba(244, 240, 231, 0.10)',
            padding: '2px 8px',
            borderRadius: '4px',
          }}
        >
          AI Search
        </span>
      </div>

      <AnimatePresence>
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-3)',
                textAlign: 'left',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Found 4 matches in 143ms:
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
              }}
            >
              {mockPhotos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 120 }}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: '#15151e',
                  }}
                >
                  <img
                    src={photo.src}
                    alt="Mock search result"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      left: '2px',
                      fontSize: '0.62rem',
                      background: 'rgba(5, 5, 5, 0.8)',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {photo.tag}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
