import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false,
    outDir: "js",
    lib: {
      entry: "src/admin/main.jsx",
      name: "IndustrialImportAdmin",
      formats: ["iife"],
      fileName: () => "admin-react.iife.js",
    },
  },
});
