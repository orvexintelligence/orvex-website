import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM-safe __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─────────────────────────────────────────────────────────────────
//  ORVEX BREACH SHIELD — Vite Configuration
// ─────────────────────────────────────────────────────────────────
export default defineConfig({
  // ── Cache dir fuori da node_modules (evita blocchi di permessi Windows)
  cacheDir: '.vite-cache',

  // ── Plugin ────────────────────────────────────────────────────
  plugins: [
    react({
      // Fast Refresh abilitato di default
      fastRefresh: true,
    }),
  ],

  // ── Path Aliases ──────────────────────────────────────────────
  // Consente import corti: import Foo from '@/components/Foo'
  resolve: {
    alias: {
      '@':           path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@data':       path.resolve(__dirname, './src/data'),
      '@assets':     path.resolve(__dirname, './public/assets'),
    },
  },

  // ── Dev Server ────────────────────────────────────────────────
  server: {
    port:        3000,
    strictPort:  false,     // Usa porta alternativa se 3000 è occupata
    open:        true,      // Apre il browser automaticamente
    host:        true,      // Espone sulla rete locale (utile per mobile)
    cors:        true,

    // Hot Module Replacement
    hmr: {
      overlay: true,        // Mostra errori a schermo intero
    },

    // ── Proxy API → Backend Express ──────────────────────────────
    //
    //  In sviluppo, le chiamate a /api/* vengono inoltrate al
    //  backend Express su porta 3001, evitando problemi CORS.
    //  In produzione il server Express viene deployato separatamente
    //  (o come middleware) e gestisce /api direttamente.
    //
    proxy: {
      '/api': {
        target:       'http://localhost:3001',
        changeOrigin: true,
        secure:       false,
        // Log richieste proxiate per debug
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[Vite Proxy] Backend non raggiungibile:', err.message)
            console.warn('[Vite Proxy] Avvia il backend con: npm run server')
          })
        },
      },
    },
  },

  // ── Preview (npm run preview) ─────────────────────────────────
  preview: {
    port: 4173,
    open: true,
  },

  // ── Build ─────────────────────────────────────────────────────
  build: {
    outDir:          'dist',
    assetsDir:       'assets',
    sourcemap:       false,   // true in staging, false in production
    minify:          'esbuild',
    target:          'es2020',

    rollupOptions: {
      output: {
        // Chunking manuale: vendor React separato dal codice app
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-ui':       ['lucide-react', 'clsx'],
          'vendor-jspdf':    ['jspdf'],   // chunk separato: ~300KB, caricato solo al download PDF
        },
        // Nomi file con hash per cache busting
        chunkFileNames:  'assets/js/[name]-[hash].js',
        entryFileNames:  'assets/js/[name]-[hash].js',
        assetFileNames:  'assets/[ext]/[name]-[hash].[ext]',
      },
    },

    // Avvisa se un chunk supera 500KB
    chunkSizeWarningLimit: 500,
  },

  // ── CSS ───────────────────────────────────────────────────────
  css: {
    devSourcemap: true,
    postcss: './postcss.config.js',
  },

  // ── Ottimizzazioni pre-bundling (dev) ─────────────────────────
  //
  //  jsPDF v4 include core-js come dipendenza CJS con import relativi
  //  del tipo "../internals/function-apply" che esbuild non riesce a
  //  risolvere quando li incontra come moduli isolati.
  //
  //  Soluzione: forziamo il pre-bundling COMPLETO di jsPDF (esbuild
  //  processa l'intero albero in un unico passaggio e risolve tutto
  //  internamente) ed escludiamo le sue dipendenze opzionali pesanti
  //  che non usiamo (canvg, html2canvas, dompurify) per evitare che
  //  vengano trascinate dentro.
  //
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'recharts',
      'lucide-react',
      'clsx',
      'jspdf',           // ← pre-bundle completo: risolve tutti gli internals core-js
    ],
    exclude: [
      'canvg',           // dipendenza opzionale jsPDF (SVG → canvas) — non usata
      'html2canvas',     // dipendenza opzionale jsPDF (DOM → canvas) — non usata
      'dompurify',       // dipendenza opzionale jsPDF (sanitize HTML) — non usata
    ],
  },

  // ── Variabili d'ambiente ──────────────────────────────────────
  // Accessibili nel codice come import.meta.env.VITE_*
  // Definire nel file .env.local (non committare!)
  envPrefix: 'VITE_',

  // ── Define (costanti globali) ─────────────────────────────────
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
    __APP_NAME__:    JSON.stringify('Orvex Breach & Identity Shield'),
  },
})
