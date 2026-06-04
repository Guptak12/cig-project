'use client';

import React, { useRef, useState, type MouseEvent } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: React.ReactElement<any>;
}

export function Magnetic({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: MouseEvent) {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    // Check if the cursor is within the magnetic zone (approx 60px radius for better feel)
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    if (distance < 70) {
      // Gently pull to the cursor with dampening factor
      setPosition({ x: distanceX * 0.35, y: distanceY * 0.35 });
    } else {
      setPosition({ x: 0, y: 0 });
    }
  }

  function handleMouseLeave() {
    setPosition({ x: 0, y: 0 });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'inline-block' }}
    >
      <motion.div
        animate={{ x: position.x, y: position.y }}
        transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
