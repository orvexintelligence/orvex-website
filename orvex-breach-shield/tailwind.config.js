/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ─────────────────────────────────────────────
      //  ORVEX COLOR SYSTEM
      // ─────────────────────────────────────────────
      colors: {
        // Backgrounds
        'orvex-void':    '#05080f',   // Sfondo principale — nero cosmico
        'orvex-deep':    '#080c14',   // Sfondo secondario / card base
        'orvex-surface': '#0d1220',   // Superfici elevate (pannelli, modal)
        'orvex-border':  '#111827',   // Bordi sottili

        // Primary — Azzurro hi-tech
        'orvex-cyan': {
          DEFAULT: '#0066ff',
          50:  '#e6f0ff',
          100: '#bbd3ff',
          200: '#80acff',
          300: '#4d8aff',
          400: '#1a66ff',
          500: '#0066ff',   // Brand primary
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },

        // Accent — Azzurro brillante glow
        'orvex-glow':  '#00aaff',   // Glow / hover highlight
        'orvex-neon':  '#00d4ff',   // Neon accents, icone attive

        // Alert — Rosso data breach
        'orvex-red': {
          DEFAULT: '#ff3333',
          dark:    '#cc0000',
          muted:   '#1a0505',       // Sfondo alert rosso
          border:  '#ff2244',
          glow:    '#ff000066',     // Box-shadow rgba
        },

        // Safe — Verde identità sicura
        'orvex-green': {
          DEFAULT: '#00ff88',
          dark:    '#00cc6a',
          muted:   '#001a0e',       // Sfondo alert verde
          border:  '#00ff88',
        },

        // Warning
        'orvex-amber': '#ffaa00',

        // Text hierarchy
        'orvex-text': {
          primary:   '#f0f4ff',     // Bianco freddo — testi principali
          secondary: '#8899bb',     // Grigio blu — sottotitoli
          muted:     '#445566',     // Placeholder, label disabilitati
          accent:    '#0066ff',     // Link / highlighted
        },
      },

      // ─────────────────────────────────────────────
      //  TYPOGRAPHY — JetBrains Mono
      // ─────────────────────────────────────────────
      fontFamily: {
        mono:  ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace'],
        sans:  ['"JetBrains Mono"', 'monospace'],  // override — tutto mono
      },
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '1rem' }],    // 10px
      },
      letterSpacing: {
        'widest-2': '0.25em',
        'widest-3': '0.35em',
      },

      // ─────────────────────────────────────────────
      //  SPACING & SIZING custom
      // ─────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '2xl-plus': '44rem',
      },
      borderRadius: {
        'xs': '2px',
      },

      // ─────────────────────────────────────────────
      //  BOX SHADOWS — effetti glow
      // ─────────────────────────────────────────────
      boxShadow: {
        'cyan-glow':    '0 0 12px rgba(0, 102, 255, 0.6), 0 0 30px rgba(0, 102, 255, 0.2)',
        'cyan-glow-lg': '0 0 20px rgba(0, 102, 255, 0.8), 0 0 60px rgba(0, 102, 255, 0.3)',
        'neon-glow':    '0 0 10px rgba(0, 212, 255, 0.7), 0 0 25px rgba(0, 212, 255, 0.3)',
        'red-glow':     '0 0 12px rgba(255, 34, 68, 0.7),  0 0 30px rgba(255, 34, 68, 0.3)',
        'red-glow-lg':  '0 0 20px rgba(255, 34, 68, 0.9),  0 0 60px rgba(255, 34, 68, 0.4)',
        'green-glow':   '0 0 12px rgba(0, 255, 136, 0.6),  0 0 30px rgba(0, 255, 136, 0.2)',
        'inner-dark':   'inset 0 2px 8px rgba(0, 0, 0, 0.6)',
        'panel':        '0 4px 24px rgba(0, 0, 0, 0.7), 0 1px 0 rgba(0, 102, 255, 0.15)',
      },

      // ─────────────────────────────────────────────
      //  ANIMATIONS & KEYFRAMES
      // ─────────────────────────────────────────────
      keyframes: {
        // Pulsazione del bordo cyan
        'border-pulse': {
          '0%, 100%': { borderColor: '#0066ff', boxShadow: '0 0 8px rgba(0,102,255,0.4)' },
          '50%':       { borderColor: '#00aaff', boxShadow: '0 0 20px rgba(0,170,255,0.8)' },
        },
        // Glow del testo
        'text-glow': {
          '0%, 100%': { textShadow: '0 0 6px rgba(0,102,255,0.5)' },
          '50%':       { textShadow: '0 0 20px rgba(0,212,255,1), 0 0 40px rgba(0,102,255,0.6)' },
        },
        // Glitch orizzontale
        'glitch': {
          '0%':   { transform: 'translate(0)' },
          '20%':  { transform: 'translate(-2px, 1px)', filter: 'hue-rotate(90deg)' },
          '40%':  { transform: 'translate(2px, -1px)', filter: 'hue-rotate(-90deg)' },
          '60%':  { transform: 'translate(-1px, 2px)' },
          '80%':  { transform: 'translate(1px, -2px)', filter: 'hue-rotate(45deg)' },
          '100%': { transform: 'translate(0)' },
        },
        // Scanline scorrimento
        'scan': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        // Fade in da sotto
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Flicker — effetto schermo instabile
        'flicker': {
          '0%, 95%, 100%': { opacity: '1' },
          '96%': { opacity: '0.6' },
          '97%': { opacity: '1' },
          '98%': { opacity: '0.4' },
          '99%': { opacity: '1' },
        },
        // Progress bar scanning
        'scan-progress': {
          '0%':   { width: '0%' },
          '100%': { width: '100%' },
        },
        // Typewriter cursor blink
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0' },
        },
        // Ping rosso per breach alert
        'breach-ping': {
          '0%':   { transform: 'scale(1)', opacity: '1' },
          '75%, 100%': { transform: 'scale(1.8)', opacity: '0' },
        },
      },
      animation: {
        'border-pulse':   'border-pulse 2s ease-in-out infinite',
        'text-glow':      'text-glow 3s ease-in-out infinite',
        'glitch':         'glitch 0.4s steps(2) infinite',
        'glitch-once':    'glitch 0.5s steps(2) 3',
        'scan-line':      'scan 4s linear infinite',
        'fade-up':        'fade-up 0.5s ease-out forwards',
        'fade-up-slow':   'fade-up 0.8s ease-out forwards',
        'flicker':        'flicker 8s linear infinite',
        'scan-progress':  'scan-progress 3s ease-in-out forwards',
        'cursor-blink':   'blink 1s step-end infinite',
        'breach-ping':    'breach-ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
      },

      // ─────────────────────────────────────────────
      //  BACKGROUND PATTERNS
      // ─────────────────────────────────────────────
      backgroundImage: {
        // Griglia hex/tech
        'grid-orvex': `
          linear-gradient(rgba(0,102,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,102,255,0.04) 1px, transparent 1px)
        `,
        // Vignette scura ai bordi
        'vignette': 'radial-gradient(ellipse at center, transparent 60%, rgba(5,8,15,0.8) 100%)',
        // Glow centrale
        'center-glow': 'radial-gradient(ellipse at 50% 50%, rgba(0,102,255,0.08) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid-32': '32px 32px',
        'grid-48': '48px 48px',
        'grid-64': '64px 64px',
      },
    },
  },
  plugins: [],
}
