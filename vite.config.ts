import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import monkey, { cdn } from "vite-plugin-monkey";

const __SCRIPT_TITLE__ = "SteamGifts Auto Detector";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: __SCRIPT_TITLE__,
        description:
          "自动检测SteamGifts的Giveaway游戏的状态（正常/受限/正在了解）。",
        icon: "https://cdn.steamgifts.com/img/favicon.ico",
        version: "0.1",
        match: ["https://www.steamgifts.com/giveaway/*"],
        author: "OreoProMax",
        license: "GLWTPL",
        namespace: "https://github.com/OreoProMax/steamgifts-auto-detect",
        updateURL:
          "https://raw.githubusercontent.com/OreoProMax/steamgifts-auto-detect/master/dist/steamgifts-auto-detect.min.user.js",
        downloadURL:
          "https://raw.githubusercontent.com/OreoProMax/steamgifts-auto-detect/master/dist/steamgifts-auto-detect.min.user.js",
        supportURL:
          "https://github.com/OreoProMax/steamgifts-auto-detect/issues",
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr("Vue", "dist/vue.global.prod.js"),
        },
      },
    }),
  ],
  define: {
    __SCRIPT_TITLE__: JSON.stringify(__SCRIPT_TITLE__),
  },
  build: {
    minify: true,
  },
});
