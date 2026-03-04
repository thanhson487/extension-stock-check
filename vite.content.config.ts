import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false, // Không xoá dist để giữ lại popup đã build
    lib: {
      entry: resolve(__dirname, "src/content/content.ts"),
      name: "content",
      fileName: () => "content.js",
      formats: ["iife"] // Build thành 1 file duy nhất, tự thực thi, không import/export
    }
  },
  define: {
    "process.env": {} // Tránh lỗi process is not defined nếu có lib nào dùng
  }
});