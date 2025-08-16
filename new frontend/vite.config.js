import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    historyApiFallback: true,
    proxy: {
      // Proxy for AnimateDiff API on separate device to handle CORS
      "/api/vision": {
        target: "http://192.168.0.121:8501",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vision/, "/generate-video"),
        configure: (proxy, options) => {
          const debug = process.env.VITE_DEBUG_PROXY === "true";
          const apiKey = process.env.VITE_VISION_API_KEY;

          if (debug) {
            proxy.on("error", (err, req, res) => {
              console.log("AnimateDiff API proxy error:", err);
            });
            proxy.on("proxyRes", (proxyRes, req, res) => {
              console.log(
                "AnimateDiff API proxy response:",
                proxyRes.statusCode,
                req.url
              );
            });
          }

          proxy.on("proxyReq", (proxyReq, req, res) => {
            if (debug) {
              console.log(
                "AnimateDiff API proxy request to 192.168.0.121:8501:",
                req.method,
                req.url
              );
            }
            if (apiKey) {
              proxyReq.setHeader("x-api-key", apiKey);
            }
          });
        },
      },
      // Additional proxy for test endpoint on separate device
      "/api/test-vision": {
        target: "http://192.168.0.121:8501",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/test-vision/, "/test-generate-video"),
        configure: (proxy, options) => {
          const debug = process.env.VITE_DEBUG_PROXY === "true";
          if (debug) {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              console.log(
                "AnimateDiff test API proxy request to 192.168.0.121:8501:",
                req.method,
                req.url
              );
            });
          }
        },
      },
    },
  },
});
