import { createApp } from "vue";
import App from "./App.vue";

import ElementPlus from "element-plus";
import "element-plus/theme-chalk/index.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

const app = createApp(App);
app.use(ElementPlus, {
  locale: zhCn,
});
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
app.mount(
  (() => {
    // 创建用于挂载的div
    const container = document.createElement("div");

    // 判断当前页面是SteamGifts还是SteamDB
    const url = window.location.href;
    app.provide("url", url); // 把url传递给App.vue
    if (url.includes("www.steamgifts.com")) {
      // 选择挂载位置
      const mountLocation = document.querySelector("div.featured__heading")!;

      // 设置div元素的宽度为挂载位置元素的高度
      const mountHeight = `${mountLocation.clientHeight}px`;
      container.style.width = mountHeight;
      // 靠右显示
      // app.style.marginLeft = "auto";
      // 内部元素水平居中
      container.style.justifyContent = "center";
      // 内部元素垂直居中
      container.style.display = "flex";

      // 将创建的div元素添加到选择的元素中
      if (mountLocation) {
        mountLocation.appendChild(container);
      } else {
        console.error("挂载位置不存在，脚本可能已经失效！");
      }
    } else if (url.includes("steamdb.info")) {
      document.body.append(container);
    }

    return container;
  })()
);
