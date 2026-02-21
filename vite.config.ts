import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/ — rebuild trigger
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    headers: {
      // Security headers for development server
      "X-Content-Type-Options": "nosniff",
      
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/*.png", "screenshots/*.png"],
      manifest: {
        name: "Armstrong — Immo-Wallet",
        short_name: "Armstrong",
        description: "Dein digitales Immobilien-Cockpit — Suche, Analyse, Finanzierung",
        theme_color: "#0a1628",
        background_color: "#0a1628",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        orientation: "any",
        start_url: "/",
        id: "/",
        categories: ["finance", "business", "productivity"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        screenshots: [
          { src: "/screenshots/desktop-dashboard.png", sizes: "1920x1080", type: "image/png", form_factor: "wide", label: "Dashboard — Dein Immobilien-Cockpit" },
          { src: "/screenshots/mobile-suche.png", sizes: "512x1024", type: "image/png", form_factor: "narrow", label: "Immo-Suche auf dem Smartphone" },
        ],
        shortcuts: [
          { name: "Immo-Suche", short_name: "Suche", url: "/portal/investments/suche", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "Dashboard", short_name: "Home", url: "/portal", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "Dokumente", short_name: "DMS", url: "/portal/stammdaten/dms", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "Finanzierung", short_name: "Finanzen", url: "/portal/finanzierung", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks — loaded on-demand by their consuming pages
          'vendor-recharts': ['recharts'],
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
    // Security: minify code and obfuscate identifiers in production
    minify: mode === 'production' ? 'terser' : 'esbuild',
    sourcemap: mode !== 'production',
    // Ensure dependencies are properly externalized for security
    target: 'esnext',
  },
}));
