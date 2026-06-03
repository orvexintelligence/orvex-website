import { useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────────
//  ScanLines — Effetto CRT / Cyber-Intelligence overlay
//
//  Uso:
//    <ScanLines />                  → full-screen fixed, default
//    <ScanLines intensity="light" /> → scanline meno visibili
//    <ScanLines beam={false} />      → solo griglia, niente beam
//
//  Il componente è puramente decorativo (pointer-events: none)
//  e si posiziona sempre sopra tutto il contenuto.
// ─────────────────────────────────────────────────────────────────

const INTENSITY = {
  light:  { lines: '0.04', noise: '0.015', beam: '0.45' },
  medium: { lines: '0.07', noise: '0.025', beam: '0.60' },
  heavy:  { lines: '0.12', noise: '0.040', beam: '0.75' },
}

export default function ScanLines({
  intensity = 'medium',
  beam = true,
  flicker = true,
  className = '',
}) {
  const cfg = INTENSITY[intensity] ?? INTENSITY.medium
  const beamRef = useRef(null)

  // Animazione beam via RAF — più fluida di CSS animation su height
  useEffect(() => {
    if (!beam || !beamRef.current) return
    const el = beamRef.current
    let start = null
    let rafId

    const DURATION = 4200 // ms per ciclo completo
    const animate = (ts) => {
      if (!start) start = ts
      const elapsed = (ts - start) % DURATION
      const progress = elapsed / DURATION          // 0 → 1
      const y = progress * 110 - 5                 // -5% → 105%
      el.style.top = `${y}%`
      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [beam])

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none fixed inset-0 z-50 overflow-hidden ${className}`}
    >
      {/* ── Layer 1: Scanline orizzontali ───────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, ${cfg.lines}) 2px,
            rgba(0, 0, 0, ${cfg.lines}) 4px
          )`,
          backgroundSize: '100% 4px',
        }}
      />

      {/* ── Layer 2: Scan beam ──────────────────────────────── */}
      {beam && (
        <div
          ref={beamRef}
          className="absolute left-0 right-0"
          style={{
            height: '2px',
            top: '-5%',
            background: `linear-gradient(
              90deg,
              transparent 0%,
              rgba(0, 102, 255, 0.0) 8%,
              rgba(0, 170, 255, ${cfg.beam}) 40%,
              rgba(0, 212, 255, 1)    50%,
              rgba(0, 170, 255, ${cfg.beam}) 60%,
              rgba(0, 102, 255, 0.0) 92%,
              transparent 100%
            )`,
            boxShadow: `
              0 0 4px  rgba(0, 212, 255, 0.5),
              0 0 12px rgba(0, 102, 255, 0.25),
              0 1px 0  rgba(0, 212, 255, 0.15)
            `,
          }}
        />
      )}

      {/* ── Layer 3: Rumore digitale (pixel SVG) ────────────── */}
      <NoiseLayer opacity={cfg.noise} />

      {/* ── Layer 4: Vignette bordi ─────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 55%,
            rgba(5, 8, 15, 0.65) 100%
          )`,
        }}
      />

      {/* ── Layer 5: Flicker sottile ────────────────────────── */}
      {flicker && <FlickerLayer />}
    </div>
  )
}

// ── Sub-component: Noise ────────────────────────────────────────
// Griglia di pixel randomici SVG — effetto rumore digitale
function NoiseLayer({ opacity }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity, mixBlendMode: 'overlay' }}
    >
      <filter id="noise-filter">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves="4"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect
        width="100%"
        height="100%"
        filter="url(#noise-filter)"
        opacity="1"
      />
    </svg>
  )
}

// ── Sub-component: Flicker ──────────────────────────────────────
// Lampi impercettibili di luminosità — simula monitor CRT instabile
function FlickerLayer() {
  return (
    <div
      className="absolute inset-0"
      style={{
        animation: 'orvex-flicker 9s linear infinite',
      }}
    >
      <style>{`
        @keyframes orvex-flicker {
          0%,   94%,  100% { opacity: 1;    }
          94.5%            { opacity: 0.92; }
          95%              { opacity: 1;    }
          96%              { opacity: 0.88; }
          96.5%            { opacity: 1;    }
          98%              { opacity: 0.95; }
        }
      `}</style>
    </div>
  )
}
