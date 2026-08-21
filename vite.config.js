import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Stamped in so the settings drawer can say which version is running and when
// it was built. The version is read from package.json rather than duplicated,
// and inside the packaged extension chrome.runtime.getManifest() is preferred
// anyway — this is what the dev server has instead.
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const BUILD_DATE = new Date().toISOString().slice(0, 10);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
  },
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
