import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
    server: {
        proxy: process.env.npm_lifecycle_event === "dev" ? {
            "/api": {
                target: "http://localhost:8080",
                changeOrigin: true,
                rewrite: (path) => path,
            },
        } : {},
    },
    plugins: [
        TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
        tailwindcss(),
        react(),
    ],
});
