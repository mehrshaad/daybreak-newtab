import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: "./index.html",
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          icons: ["react-icons"],
        },
      },
    },
  },
  base: "./",
  test: {
    // jsdom so component tests can render; pure-logic tests are unaffected.
    environment: "jsdom",
    // Widgets and the sdk live in workspace packages, so their tests do too.
    include: ["src/**/*.test.{js,jsx}", "packages/**/*.test.{js,jsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    setupFiles: ["./src/test/setup.js"],
  },
});
