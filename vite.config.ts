import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://ipy5mikcmj.execute-api.eu-north-1.amazonaws.com",
        changeOrigin: true,
        secure: true,
     
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
