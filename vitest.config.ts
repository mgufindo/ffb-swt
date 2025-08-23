// vitest.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: './src/setupTests.ts',
    outputFile: "test-results.json",
    include: [
      'src/**/*.test.{ts,tsx}',
      'src/**/__tests__/*.{ts,tsx}',
    ],
    testTimeout: 30000, // Timeout global 30 detik
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
