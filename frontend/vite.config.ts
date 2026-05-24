import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Блок конфигурации Vite включает React-плагин и алиас для удобных импортов.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@xyflow/react") || id.includes("node_modules/dagre")) {
            return "roadmap-flow-vendor";
          }

          if (id.includes("node_modules/react-router-dom")) {
            return "router-vendor";
          }

          if (id.includes("node_modules/@tanstack/react-query")) {
            return "query-vendor";
          }

          if (
            id.includes("node_modules/react-hook-form") ||
            id.includes("node_modules/@hookform/resolvers") ||
            id.includes("node_modules/zod")
          ) {
            return "forms-vendor";
          }

          return undefined;
        }
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Блок проксирует API-запросы dev-сервера Vite в локальный Flask backend.
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true
      }
    }
  }
});
