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
          antd: ["antd", "@ant-design/icons"],
          icons: ["react-icons"],
        },
      },
    },
  },
  assetsInclude: [
    "**/*.jpg",
    "**/*.jpeg",
    "**/*.png",
    "**/*.gif",
    "**/*.svg",
    "**/*.JPG",
    "**/*.webp",
  ],
  base: "./",
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
  },
});
