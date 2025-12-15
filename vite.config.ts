import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/year-in-review-grid/",
  plugins: [vue()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
