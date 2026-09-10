import React from 'react';
import { PortalRoute } from '../types';
import { ArrowRight, Sparkles, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingViewProps {
  onNavigate: (route: PortalRoute) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const handleStart = () => {
    onNavigate('portal-selection');
  };

  // Floating ambient micro droplets
  const ambientDrops = [
    { id: 1, size: 14, left: '18%', duration: 7, delay: 0, opacity: 0.22, xOffset: 16 },
    { id: 2, size: 20, left: '26%', duration: 9, delay: 1.8, opacity: 0.28, xOffset: -22 },
    { id: 3, size: 10, left: '38%', duration: 6.5, delay: 3.2, opacity: 0.18, xOffset: 14 },
    { id: 4, size: 24, left: '72%', duration: 8.5, delay: 0.8, opacity: 0.25, xOffset: -18 },
    { id: 5, size: 12, left: '82%', duration: 7.2, delay: 2.4, opacity: 0.2, xOffset: 20 },
    { id: 6, size: 18, left: '88%', duration: 9.8, delay: 4.1, opacity: 0.24, xOffset: -15 },
  ];

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] flex flex-col items-center justify-center px-4 font-sans select-none">
      
      {/* 1. Ambient Background Glows & Floating Micro-Droplets */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft overhead clinical light blur */}
        <motion.div
          animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-radial from-white via-white/70 to-transparent blur-3xl opacity-90"
        />

        {/* Ambient floating translucent blood micro-droplets */}
        {ambientDrops.map((drop) => (
          <motion.div
            key={drop.id}
            initial={{ y: '110vh', opacity: 0, x: 0 }}
            animate={{
              y: '-15vh',
              opacity: [0, drop.opacity, drop.opacity, 0],
              x: [0, drop.xOffset, -drop.xOffset, 0],
            }}
            transition={{
              duration: drop.duration,
              repeat: Infinity,
              delay: drop.delay,
              ease: 'easeInOut',
            }}
            style={{
              left: drop.left,
              width: `${drop.size}px`,
              height: `${drop.size * 1.25}px`,
            }}
            className="absolute rounded-full bg-gradient-to-b from-rose-400/80 via-red-500/70 to-red-700/80 blur-[0.4px] shadow-[0_4px_12px_rgba(225,29,72,0.25)]"
          />
        ))}

        {/* Floating cross & sparkle accents */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 8, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[18%] right-[14%] text-rose-400/50 flex items-center gap-1 font-serif text-2xl"
        >
          <span>✦</span>
        </motion.div>
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [0, -10, 0], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[22%] left-[14%] text-rose-400/40 text-xl font-serif"
        >
          <span>✦</span>
        </motion.div>
      </div>

      {/* 2. Main Centered Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
        
        {/* Animated Blood Drop Logo Pop-Up & Rhythmic Heartbeat */}
        <div className="relative flex items-center justify-center mb-7">
          
          {/* Subtle multi-layer concentric ripple waves pulsing outwards */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [1, 1.42, 1],
              opacity: [0.4, 0.08, 0.4],
            }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-44 h-44 rounded-full border border-rose-300/40 pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [1, 1.75, 1],
              opacity: [0.25, 0.03, 0.25],
            }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            className="absolute w-56 h-56 rounded-full border border-rose-200/30 pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [1, 2.1, 1],
              opacity: [0.15, 0.01, 0.15],
            }}
            transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            className="absolute w-64 h-64 rounded-full border border-rose-100/25 pointer-events-none"
          />

          {/* Logo Pop-Up Container with Gentle Floating & Spring Bounce */}
          <motion.div
            initial={{ scale: 0.1, opacity: 0, y: 40 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: [0, -6, 0],
            }}
            transition={{
              scale: { type: 'spring', stiffness: 280, damping: 18, delay: 0.1 },
              opacity: { duration: 0.4, delay: 0.1 },
              y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
            }}
            whileHover={{ scale: 1.06, rotate: [0, -2, 2, 0], transition: { duration: 0.3 } }}
            className="relative z-10 w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-white flex items-center justify-center shadow-[0_16px_42px_rgba(225,29,72,0.18)] border-[3.5px] border-rose-100/90 cursor-pointer"
          >
            {/* Soft inner ambient glow */}
            <div className="absolute inset-2 rounded-full bg-radial from-rose-50/70 to-transparent pointer-events-none" />

            {/* Blood Drop with Medical Cross Vector + Dual-Pulse Heartbeat */}
            <motion.svg
              viewBox="0 0 100 120"
              className="w-18 h-22 sm:w-20 sm:h-24 drop-shadow-[0_8px_18px_rgba(185,28,28,0.32)]"
              animate={{
                scale: [1, 1.08, 0.98, 1.06, 1], // Organic diastolic/systolic heartbeat pattern
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
                times: [0, 0.14, 0.28, 0.42, 1],
              }}
            >
              <defs>
                <linearGradient id="dropGradLogo" x1="20%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="35%" stopColor="#dc2626" />
                  <stop offset="90%" stopColor="#991b1b" />
                </linearGradient>
                <radialGradient id="dropGleamLogo" cx="35%" cy="30%" r="35%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#ffffff" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="shimmerSweep" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
              
              {/* Droplet Outline */}
              <path
                d="M 50 10 C 50 10, 86 54, 86 78 A 36 36 0 0 1 14 78 C 14 54, 50 10, 50 10 Z"
                fill="url(#dropGradLogo)"
              />
              
              {/* Specular Droplet Gleam */}
              <path
                d="M 46 22 C 46 22, 32 46, 30 62 C 28 72, 32 76, 32 76 C 32 76, 26 70, 28 60 C 30 46, 42 26, 46 22 Z"
                fill="url(#dropGleamLogo)"
              />

              {/* Centered White Medical Cross */}
              <path
                d="M 45 61 H 55 V 69 H 63 V 79 H 55 V 87 H 45 V 79 H 37 V 69 H 45 Z"
                fill="#ffffff"
                className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
              />
            </motion.svg>
          </motion.div>
        </div>

        {/* Brand Name with Staggered Fade & Slide */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 font-display">
              BloodLink
            </h1>
            <motion.span
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="text-red-500 inline-block"
            >
              <Sparkles className="w-4 h-4" />
            </motion.span>
          </div>

          {/* Tagline with Animated Underline Accent */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-base sm:text-lg font-medium text-slate-600 mb-7 max-w-sm px-2"
          >
            Connecting Lives. One Drop at a Time.
          </motion.p>
        </motion.div>

        {/* Animated ECG Pulse Rhythm Line */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="relative w-56 h-7 mb-7 flex items-center justify-center overflow-hidden"
        >
          <svg viewBox="0 0 200 30" className="w-full h-full stroke-rose-400/60 fill-none stroke-[2]">
            <motion.path
              d="M 0 15 L 60 15 L 70 8 L 80 22 L 90 2 L 100 28 L 110 15 L 200 15"
              strokeDasharray="240"
              initial={{ strokeDashoffset: 240 }}
              animate={{ strokeDashoffset: [240, 0, -240] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
          {/* Glowing pulse dot traveling on the line */}
          <motion.div
            animate={{
              left: ['0%', '100%'],
              opacity: [0, 1, 1, 0],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]"
          />
        </motion.div>

        {/* Get Started Button with Shimmer Reflection & Pulse */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="relative"
        >
          {/* Subtle button ambient pulse halo */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.35, 0.1, 0.35],
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-1 rounded-full bg-red-500/25 blur-sm pointer-events-none"
          />

          <button
            id="get-started-btn"
            onClick={handleStart}
            className="group relative overflow-hidden inline-flex items-center justify-center gap-2.5 px-9 py-3.5 sm:px-11 sm:py-4 rounded-full bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-semibold text-base sm:text-lg shadow-[0_10px_28px_rgba(211,47,47,0.4)] hover:shadow-[0_16px_36px_rgba(211,47,47,0.55)] transition-all duration-300 cursor-pointer active:scale-95"
          >
            {/* Shimmer light beam sweep passing through button */}
            <motion.div
              animate={{
                x: ['-120%', '220%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatDelay: 1.5,
              }}
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
            />

            <span className="relative z-10">Get Started</span>
            <ArrowRight className="w-5 h-5 relative z-10 transition-transform duration-200 group-hover:translate-x-1 inline-block" />
          </button>
        </motion.div>

      </div>
    </div>
  );
};
