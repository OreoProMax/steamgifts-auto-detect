import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import monkey, { cdn, util } from "vite-plugin-monkey";

const SCRIPT_TITLE = "SteamGifts Auto Detector";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: SCRIPT_TITLE,
        description:
          "自动检测SteamGifts的Giveaway游戏的状态（正常/受限/正在了解）。",
        version: "1.2",
        icon: "https://cdn.steamgifts.com/img/favicon.ico",
        match: [
          "https://www.steamgifts.com/giveaway/*",
          "https://steamdb.info/*",
        ],
        connect: ["store.steampowered.com", "barter.vg"],
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
          vue: cdn.jsdelivr("Vue", "dist/vue.global.prod.js").concat(
            await util.fn2dataUrl(() => {
              // @ts-ignore
              window.Vue = Vue;
            })
          ),
          "element-plus": cdn.jsdelivr("ElementPlus", "dist/index.full.min.js"),
          "@element-plus/icons-vue": cdn.jsdelivr(
            "ElementPlusIconsVue",
            "dist/index.iife.min.js"
          ),
        },
        externalResource: {
          "element-plus/dist/index.min.css": cdn.jsdelivr(),
        },
      },
    }),
  ],
  define: {
    __SCRIPT_TITLE__: JSON.stringify(SCRIPT_TITLE),
    __LIMITED_STATUS__: JSON.stringify("受限"),
    __LEARNING_STATUS__: JSON.stringify("正在了解"),
    __NORMAL_STATUS__: JSON.stringify("正常"),
  },
  build: {
    minify: true,
  },
});
