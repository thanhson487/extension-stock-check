import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/content/funds.content.ts"),
      name: "fundsContent",
      fileName: () => "funds.content.js",
      formats: ["iife"],
    },
  },
  define: {
    "process.env": {},
  },
});
