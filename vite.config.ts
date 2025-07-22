import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Ensure native modules are properly bundled
    rollupOptions: {
      external: [
        'better-sqlite3',
        'knex',
        'electron'
      ],
    },
  },
  optimizeDeps: {
    // Exclude knex and sqlite from optimization
    exclude: [
      'knex',
      'better-sqlite3',
      'sqlite3'
    ],
  },
}));