import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // ambil env sesuai mode (development / production)
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "html-transform",
        transformIndexHtml(html) {
          return html.replace(
            /<title>(.*?)<\/title>/,
            `<title>${env.VITE_APP_NAME}</title>`
          );
        },
      },
    ],
    server: {
      host: "0.0.0.0",
      port: env.VITE_PORT ? parseInt(env.VITE_PORT) : 3000,
    },
    preview: {
      port: env.VITE_PREVIEW_PORT ? parseInt(env.VITE_PREVIEW_PORT) : 3000,
    },
    define: {
      global: "globalThis",
    },
    resolve: {
      alias: {
        buffer: "buffer",
        process: "process/browser",
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: "globalThis",
        },
      },
    },
  };
});
