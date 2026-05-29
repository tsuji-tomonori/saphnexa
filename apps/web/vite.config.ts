import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@saphnexa/api-client": new URL("../../packages/api-client/src/client.ts", import.meta.url).pathname,
      "@saphnexa/ui": new URL("../../packages/ui/src/components.tsx", import.meta.url).pathname
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true
  }
});
