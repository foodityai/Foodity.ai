import React, { useEffect, useRef, useMemo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITY — classify query complexity
   ═══════════════════════════════════════════════════════════════════════════ */
export function classifyQuery(text = '') {
  const complex = [
    'plan','week','month','diet','explain','compare','analyse','analyze',
    'detailed','full','complete','provide','how to','why','difference',
    'guide','recommend','suggest','create','build','generate','list',
  ];
  const lower = text.toLowerCase();
  if (text.length > 100 || complex.some(k => lower.includes(k))) return 'complex';
  return 'simple';
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED SVG DEFS — gradients used across all SVG components
   ═══════════════════════════════════════════════════════════════════════════ */
function SharedDefs() {
  return (
    <defs>
      <linearGradient id="green1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
      <linearGradient id="green2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
      <linearGradient id="metal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="darkMetal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SVG 1 — FRYING PAN (separate component)
   ═══════════════════════════════════════════════════════════════════════════ */
function FryingPanSVG() {
  return (
    <motion.g id="frying-pan">
      {/* Handle */}
      <rect x="10" y="14" width="38" height="7" rx="3.5" fill="url(#darkMetal)" />
      <rect x="10" y="15" width="38" height="3" rx="1.5" fill="#64748b" opacity="0.4" />
      {/* Pan bowl */}
      <ellipse cx="80" cy="18" rx="38" ry="12" fill="url(#darkMetal)" />
      <ellipse cx="80" cy="16" rx="34" ry="9" fill="#334155" />
      {/* Inner surface */}
      <ellipse cx="80" cy="15" rx="30" ry="7" fill="#1e293b" />
      {/* Rim highlight */}
      <ellipse cx="80" cy="12" rx="28" ry="3" fill="#475569" opacity="0.5" />
    </motion.g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SVG 2 — COOKING POT (separate component)
   ═══════════════════════════════════════════════════════════════════════════ */
function CookingPotSVG() {
  return (
    <motion.g id="cooking-pot">
      {/* Left handle */}
      <rect x="18" y="10" width="12" height="5" rx="2.5" fill="#64748b" />
      {/* Right handle */}
      <rect x="110" y="10" width="12" height="5" rx="2.5" fill="#64748b" />
      {/* Pot body */}
      <path d="M 32 8 L 108 8 L 104 38 Q 70 44 36 38 Z" fill="url(#darkMetal)" />
      {/* Rim */}
      <ellipse cx="70" cy="8" rx="40" ry="6" fill="#475569" />
      <ellipse cx="70" cy="7" rx="37" ry="4.5" fill="#334155" />
      {/* Lid knob */}
      <ellipse cx="70" cy="2" rx="6" ry="3" fill="#64748b" />
      <ellipse cx="70" cy="1" rx="4" ry="2" fill="#94a3b8" />
    </motion.g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SVG 3 — SERVING PLATE (separate component)
   ═══════════════════════════════════════════════════════════════════════════ */
function ServingPlateSVG() {
  return (
    <motion.g id="serving-plate">
      {/* Cloche dome */}
      <path d="M 25 28 Q 25 2 60 0 Q 95 2 95 28 Z" fill="#e2e8f0" opacity="0.85" />
      <path d="M 25 28 Q 25 2 60 0 Q 95 2 95 28 Z" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
      {/* Plate base */}
      <ellipse cx="60" cy="28" rx="40" ry="5" fill="url(#metal)" />
      <ellipse cx="60" cy="29" rx="38" ry="3" fill="#94a3b8" opacity="0.4" />
      {/* Handle knob */}
      <circle cx="60" cy="-2" r="4" fill="#94a3b8" />
      <circle cx="60" cy="-3" r="2.5" fill="#cbd5e1" />
      {/* Glare */}
      <path d="M 40 10 Q 55 4 70 14" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.35" />
    </motion.g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROBOT SVG — minimal AI assistant with chef elements
   ═══════════════════════════════════════════════════════════════════════════ */
function RobotSVG({ chefState }) {
  const isCooking  = chefState === 'cooking_simple' || chefState === 'cooking_complex';
  const isServing  = chefState === 'serving';
  const isCatching = chefState === 'catching';
  const isComplex  = chefState === 'cooking_complex';
  const isSimple   = chefState === 'cooking_simple';

  const leftArm  = useAnimation();
  const rightArm = useAnimation();
  const headCtrl = useAnimation();
  const bodyCtrl = useAnimation();

  const loopL = useRef(false);
  const loopR = useRef(false);

  useEffect(() => {
    const go = async () => {
      /* ── CATCHING ──────────────────────────────────── */
      if (chefState === 'catching') {
        await Promise.all([
          leftArm.start({
            rotate: [0, -100, -70],
            transition: { duration: 0.5, ease: 'easeOut' },
          }),
          rightArm.start({
            rotate: [0, 100, 70],
            transition: { duration: 0.5, ease: 'easeOut' },
          }),
        ]);
        await bodyCtrl.start({
          y: [0, -8, 3, 0],
          transition: { duration: 0.45, ease: 'easeOut' },
        });
        return;
      }

      /* ── SIMPLE COOKING ───────────────────────────── */
      if (chefState === 'cooking_simple') {
        loopL.current = true;
        loopR.current = true;
        // left arm flips pan
        (async () => {
          while (loopL.current) {
            await leftArm.start({
              rotate: [0, -55, 0],
              transition: { duration: 0.7, ease: 'easeInOut' },
            });
            await new Promise(r => setTimeout(r, 150));
          }
        })();
        // body gentle hover
        (async () => {
          while (loopR.current) {
            await bodyCtrl.start({
              y: [0, -5, 0],
              transition: { duration: 1.6, ease: 'easeInOut' },
            });
          }
        })();
        return;
      }

      /* ── COMPLEX COOKING ──────────────────────────── */
      if (chefState === 'cooking_complex') {
        loopL.current = true;
        loopR.current = true;
        // left arm stirs circularly
        (async () => {
          while (loopL.current) {
            await leftArm.start({
              rotate: [0, -25, -55, -80, -55, -25, 0],
              x: [0, 6, 0, -6, 0, 6, 0],
              transition: { duration: 1.1, ease: 'easeInOut' },
            });
          }
        })();
        // head tilts rhythmically
        (async () => {
          while (loopR.current) {
            await headCtrl.start({
              rotate: [0, -4, 0, 4, 0],
              transition: { duration: 1.4, ease: 'easeInOut' },
            });
          }
        })();
        return;
      }

      /* ── SERVING ──────────────────────────────────── */
      if (chefState === 'serving') {
        loopL.current = false;
        loopR.current = false;
        // wide presentation
        await Promise.all([
          leftArm.start({ rotate: -110, x: -4, transition: { duration: 0.4, ease: 'easeOut' } }),
          rightArm.start({ rotate: 110, x: 4, transition: { duration: 0.4, ease: 'easeOut' } }),
        ]);
        await headCtrl.start({ rotate: [0, -5, 5, 0], transition: { duration: 0.45 } });
        // throw forward
        await Promise.all([
          leftArm.start({ rotate: -35, y: -12, transition: { duration: 0.3 } }),
          rightArm.start({ rotate: 35, y: -12, transition: { duration: 0.3 } }),
        ]);
        await bodyCtrl.start({ y: [0, -10, 0], transition: { duration: 0.4, ease: 'easeOut' } });
        // reset arms
        await Promise.all([
          leftArm.start({ rotate: 0, x: 0, y: 0, transition: { duration: 0.45 } }),
          rightArm.start({ rotate: 0, x: 0, y: 0, transition: { duration: 0.45 } }),
        ]);
        return;
      }

      /* ── IDLE ──────────────────────────────────────── */
      if (chefState === 'idle') {
        loopL.current = false;
        loopR.current = false;
        leftArm.stop(); rightArm.stop(); headCtrl.stop(); bodyCtrl.stop();
        await Promise.all([
          leftArm.start({ rotate: 0, x: 0, y: 0, transition: { duration: 0.35 } }),
          rightArm.start({ rotate: 0, x: 0, y: 0, transition: { duration: 0.35 } }),
          headCtrl.start({ rotate: 0, y: 0, transition: { duration: 0.35 } }),
          bodyCtrl.start({ y: 0, transition: { duration: 0.35 } }),
        ]);
      }
    };
    go();
    return () => { loopL.current = false; loopR.current = false; };
  }, [chefState]);

  return (
    <motion.svg
      viewBox="0 0 200 280"
      width="180"
      height="250"
      fill="none"
      style={{ overflow: 'visible', transformOrigin: 'bottom center' }}
    >
      <SharedDefs />

      {/* ── SHADOW on floor ───────────────── */}
      <ellipse cx="100" cy="260" rx="40" ry="5" fill="#000" opacity="0.1" />

      {/* ── BODY GROUP ────────────────────── */}
      <motion.g animate={bodyCtrl} style={{ transformOrigin: '100px 180px' }}>

        {/* ── LEGS (slim pillars) ─────────── */}
        <rect x="78" y="218" width="10" height="30" rx="5" fill="url(#metal)" />
        <rect x="112" y="218" width="10" height="30" rx="5" fill="url(#metal)" />
        {/* Feet */}
        <ellipse cx="83" cy="250" rx="10" ry="4" fill="#94a3b8" />
        <ellipse cx="117" cy="250" rx="10" ry="4" fill="#94a3b8" />

        {/* ── TORSO (pill capsule) ────────── */}
        <rect x="62" y="148" width="76" height="74" rx="24" fill="url(#green2)" />
        {/* Center core ring */}
        <circle cx="100" cy="185" r="14" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.2" />
        <circle cx="100" cy="185" r="6" fill="#fff" opacity="0.9" filter="url(#glow)" />
        {/* Secondary indicator dots */}
        <circle cx="82" cy="168" r="2.5" fill="#fff" opacity="0.5" />
        <circle cx="118" cy="168" r="2.5" fill="#fff" opacity="0.5" />

        {/* ── LEFT ARM ───────────────────── */}
        <motion.g
          animate={leftArm}
          style={{ transformOrigin: '58px 162px' }}
        >
          {/* Shoulder */}
          <circle cx="58" cy="162" r="8" fill="url(#metal)" />
          {/* Upper arm */}
          <path d="M 58 170 Q 38 186 34 206" stroke="url(#metal)" strokeWidth="9" strokeLinecap="round" fill="none" />
          {/* Elbow joint */}
          <circle cx="34" cy="206" r="5" fill="#94a3b8" />
          {/* Lower arm */}
          <path d="M 34 211 L 32 226" stroke="url(#metal)" strokeWidth="7" strokeLinecap="round" fill="none" />
          {/* Hand */}
          <circle cx="32" cy="228" r="7" fill="url(#green1)" />
          <circle cx="32" cy="228" r="3" fill="#fff" opacity="0.3" />
        </motion.g>

        {/* ── RIGHT ARM ──────────────────── */}
        <motion.g
          animate={rightArm}
          style={{ transformOrigin: '142px 162px' }}
        >
          {/* Shoulder */}
          <circle cx="142" cy="162" r="8" fill="url(#metal)" />
          {/* Upper arm */}
          <path d="M 142 170 Q 162 186 166 206" stroke="url(#metal)" strokeWidth="9" strokeLinecap="round" fill="none" />
          {/* Elbow joint */}
          <circle cx="166" cy="206" r="5" fill="#94a3b8" />
          {/* Lower arm */}
          <path d="M 166 211 L 168 226" stroke="url(#metal)" strokeWidth="7" strokeLinecap="round" fill="none" />
          {/* Hand */}
          <circle cx="168" cy="228" r="7" fill="url(#green1)" />
          <circle cx="168" cy="228" r="3" fill="#fff" opacity="0.3" />
        </motion.g>

      </motion.g>

      {/* ── HEAD GROUP ────────────────────── */}
      <motion.g animate={headCtrl} style={{ transformOrigin: '100px 120px' }}>
        {/* Neck */}
        <rect x="94" y="136" width="12" height="14" rx="6" fill="url(#metal)" />

        {/* Head shell */}
        <rect x="62" y="62" width="76" height="76" rx="26" fill="url(#green2)" />

        {/* Inner screen bezel */}
        <rect x="68" y="68" width="64" height="64" rx="20" fill="url(#screenGrad)" />

        {/* ── EYES ────────────────────────── */}
        {isCatching ? (
          <>
            {/* Wide surprised eyes */}
            <ellipse cx="85" cy="96" rx="7" ry="9" fill="#4ade80" opacity="0.95" />
            <ellipse cx="115" cy="96" rx="7" ry="9" fill="#4ade80" opacity="0.95" />
            <circle cx="83" cy="93" r="2.5" fill="#fff" opacity="0.8" />
            <circle cx="113" cy="93" r="2.5" fill="#fff" opacity="0.8" />
          </>
        ) : isServing ? (
          <>
            {/* Happy curved eyes */}
            <path d="M 78 96 Q 85 88 92 96" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 108 96 Q 115 88 122 96" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            {/* Normal calm eyes */}
            <ellipse cx="85" cy="96" rx="6" ry="7" fill="#4ade80" opacity="0.9" />
            <ellipse cx="115" cy="96" rx="6" ry="7" fill="#4ade80" opacity="0.9" />
            <circle cx="83" cy="94" r="2" fill="#fff" opacity="0.7" />
            <circle cx="113" cy="94" r="2" fill="#fff" opacity="0.7" />
          </>
        )}

        {/* ── MOUTH ───────────────────────── */}
        {isServing ? (
          <path d="M 86 112 Q 100 122 114 112" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ) : isCatching ? (
          <ellipse cx="100" cy="114" rx="6" ry="5" fill="#4ade80" opacity="0.7" />
        ) : isCooking ? (
          <path d="M 90 113 Q 100 118 110 113" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M 90 112 Q 100 117 110 112" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" fill="none" />
        )}

        {/* ── ANTENNA (chef hat hint) ─────── */}
        <line x1="100" y1="62" x2="100" y2="46" stroke="url(#metal)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="100" cy="44" r="5" fill="url(#green1)" />
        <circle cx="100" cy="44" r="2" fill="#fff" opacity="0.6" />
        {/* Leaf accents on antenna */}
        <path d="M 95 50 Q 92 44 96 40" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M 105 50 Q 108 44 104 40" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Screen soft glow edge */}
        <rect x="68" y="68" width="64" height="64" rx="20" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.25" />
      </motion.g>

      {/* ── UTENSILS (conditionally rendered) ─── */}

      {/* Frying Pan — simple cooking */}
      <AnimatePresence>
        {isSimple && (
          <motion.g
            key="pan"
            initial={{ y: 30, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{ transformOrigin: '100px 252px' }}
            transform="translate(20, 234)"
          >
            <FryingPanSVG />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Cooking Pot — complex cooking */}
      <AnimatePresence>
        {isComplex && (
          <motion.g
            key="pot"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 25, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            style={{ transformOrigin: '100px 252px' }}
            transform="translate(30, 222)"
          >
            <CookingPotSVG />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Serving Plate — serving */}
      <AnimatePresence>
        {isServing && (
          <motion.g
            key="plate"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ transformOrigin: '100px 165px' }}
            transform="translate(40, 136)"
          >
            <ServingPlateSVG />
          </motion.g>
        )}
      </AnimatePresence>

    </motion.svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PARTICLES — floating leaves
   ═══════════════════════════════════════════════════════════════════════════ */
function Leaf({ x, delay }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: x, bottom: '60%', fontSize: 13, zIndex: 5 }}
      initial={{ y: 0, opacity: 0, rotate: 0 }}
      animate={{
        y: [-8, -50, -100, -160],
        opacity: [0, 0.9, 0.8, 0],
        rotate: [0, 18, -15, 8],
        x: [0, 10, -6, 3],
      }}
      transition={{ duration: 2.2, delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.5 }}
    >
      🌿
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PARTICLES — binary digits
   ═══════════════════════════════════════════════════════════════════════════ */
function BinaryDigit({ x, digit, delay }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none font-mono text-[11px] font-bold"
      style={{ left: x, bottom: '55%', color: '#4ade80', zIndex: 5, textShadow: '0 0 6px #22c55e55' }}
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: [-5, -70, -140], opacity: [0, 0.85, 0] }}
      transition={{ duration: 1.6, delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.7 }}
    >
      {digit}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FLYING BUBBLE — message shoots toward robot
   ═══════════════════════════════════════════════════════════════════════════ */
function FlyingBubble({ text, active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="fly-bubble"
          className="absolute pointer-events-none z-30 max-w-[180px] px-3 py-1.5 rounded-2xl rounded-br-sm text-[11px] font-medium text-white shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            bottom: 56,
            right: 20,
            transformOrigin: 'bottom right',
          }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{ y: -200, opacity: [1, 1, 0], scale: [1, 0.9, 0.4] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 0.68, 0.36, 1] }}
        >
          <span className="line-clamp-1">{text?.slice(0, 50) || '…'}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FIRE EFFECT — background radial flare
   ═══════════════════════════════════════════════════════════════════════════ */
function FireFlare({ active, color = '#ef4444' }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="fire-flare"
          className="absolute inset-0 pointer-events-none z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.15, 0.08, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(ellipse at bottom center, ${color}44 0%, transparent 65%)`,
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GREEN FLAME — AI cooking flame below pot
   ═══════════════════════════════════════════════════════════════════════════ */
function GreenFlame({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="green-flame"
          className="absolute pointer-events-none flex gap-1 items-end"
          style={{ bottom: -2, left: '50%', transform: 'translateX(-50%)', zIndex: 4 }}
          initial={{ opacity: 0, scaleY: 0.4 }}
          animate={{ opacity: 1, scaleY: [0.5, 1, 0.7, 1.1, 0.8] }}
          exit={{ opacity: 0 }}
          transition={{ scaleY: { repeat: Infinity, duration: 0.8 }, opacity: { duration: 0.4 } }}
        >
          {['14px', '20px', '16px'].map((h, i) => (
            <motion.div
              key={i}
              style={{
                width: 8,
                height: h,
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                background: 'linear-gradient(to top, #15803d, #4ade80, #bbf7d0)',
                opacity: 0.8,
              }}
              animate={{ scaleY: [1, 1.2, 0.9, 1.1, 1] }}
              transition={{ duration: 0.6 + i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEAM LINES — wavy steam for complex cooking
   ═══════════════════════════════════════════════════════════════════════════ */
function SteamLines({ active }) {
  const lines = [
    { left: '38%', delay: 0 },
    { left: '50%', delay: 0.3 },
    { left: '62%', delay: 0.6 },
  ];
  return (
    <AnimatePresence>
      {active && lines.map((l, i) => (
        <motion.div
          key={`steam-${i}`}
          className="absolute pointer-events-none"
          style={{ left: l.left, bottom: '52%', width: 2, height: 20, borderRadius: 1, background: '#4ade80', zIndex: 4 }}
          initial={{ opacity: 0, y: 0, scaleY: 0.5 }}
          animate={{ opacity: [0, 0.6, 0], y: [-5, -45], scaleY: [0.5, 1.5] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, delay: l.delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.3 }}
        />
      ))}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SERVING PLATE FLY — plate zooms toward chat on serve
   ═══════════════════════════════════════════════════════════════════════════ */
function ServingPlateFly({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="serve-fly"
          className="absolute pointer-events-none"
          style={{ top: '30%', left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}
          initial={{ y: 0, scale: 1, opacity: 1 }}
          animate={{ y: -120, scale: [1, 1.6, 2.8], opacity: [1, 1, 0] }}
          transition={{ duration: 0.85, delay: 0.8, ease: [0.32, 1.5, 0.62, 1] }}
        >
          <span style={{ fontSize: 32 }}>🍽️</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT — ChefAnimation orchestrator
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ChefAnimation({
  chefState = 'idle',
  flyingText = '',
  onServeComplete,
}) {
  const isVisible  = chefState !== 'idle';
  const isCooking  = chefState === 'cooking_simple' || chefState === 'cooking_complex';
  const isComplex  = chefState === 'cooking_complex';
  const isSimple   = chefState === 'cooking_simple';
  const isServing  = chefState === 'serving';
  const isCatching = chefState === 'catching';

  const calledRef = useRef(false);

  // Fire onServeComplete after serving animation finishes
  useEffect(() => {
    if (isServing) {
      calledRef.current = false;
      const t = setTimeout(() => {
        if (!calledRef.current) {
          calledRef.current = true;
          onServeComplete?.();
        }
      }, 2400);
      return () => clearTimeout(t);
    }
  }, [isServing, onServeComplete]);

  // Particles
  const leaves = useMemo(() => (
    isComplex
      ? [{ x: '25%', delay: 0 }, { x: '50%', delay: 0.45 }, { x: '75%', delay: 0.9 }]
      : []
  ), [isComplex]);

  const binary = useMemo(() => (
    isCooking
      ? [
          { x: '15%', digit: '1', delay: 0.1 },
          { x: '35%', digit: '0', delay: 0.5 },
          { x: '60%', digit: '1', delay: 0.25 },
          { x: '82%', digit: '0', delay: 0.65 },
        ]
      : []
  ), [isCooking]);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-end">

      {/* Background fire flare */}
      <FireFlare active={isSimple} color="#ef4444" />
      <FireFlare active={isComplex} color="#22c55e" />

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {leaves.map((l, i) => <Leaf key={`l${i}`} {...l} />)}
        {binary.map((b, i) => <BinaryDigit key={`b${i}`} {...b} />)}
      </div>

      {/* Steam lines for complex */}
      <SteamLines active={isComplex} />

      {/* Flying bubble */}
      <div className="absolute inset-0">
        <FlyingBubble text={flyingText} active={isCatching} />
      </div>

      {/* Robot container */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="chef-robot"
            className="relative flex flex-col items-center"
            style={{ marginBottom: 6 }}
            initial={{ y: 100, opacity: 0, scale: 0.85 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.75 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="relative">
              <GreenFlame active={isComplex} />
              <RobotSVG chefState={chefState} />
            </div>

            {/* Serving plate fly */}
            <ServingPlateFly active={isServing} />

            {/* Status label */}
            <motion.div
              className="mt-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest select-none"
              style={{
                background: 'rgba(34,197,94,0.12)',
                color: '#4ade80',
                border: '1px solid rgba(34,197,94,0.25)',
                backdropFilter: 'blur(8px)',
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              {chefState === 'catching'       && '✋ Catching…'}
              {chefState === 'cooking_simple'  && '🍳 Cooking…'}
              {chefState === 'cooking_complex' && '🍲 Deep Cooking…'}
              {chefState === 'serving'         && '🍽️ Serving!'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
