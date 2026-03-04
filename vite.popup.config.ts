import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true, // Xoá dist cũ khi bắt đầu build chuỗi
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.html")
      },
      output: {
        entryFileNames: "[name].js"
      }
    }
  }
});