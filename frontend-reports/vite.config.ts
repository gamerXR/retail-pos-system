import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "~backend": path.resolve(__dirname, "../__encore/clients")
    }
  },
  server: {
    port: 5174,
    strictPort: false
  }
});
