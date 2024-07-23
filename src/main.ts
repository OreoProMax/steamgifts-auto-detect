import { createApp } from "vue";
// import "./style.css";
import App from "./App.vue";

createApp(App).mount(
  (() => {
    // 选择挂载位置
    const mountLocation = document.querySelector("div.featured__heading");
    // 创建一个div元素
    const app = document.createElement("div");
    // 将创建的div元素添加到选择的元素中
    if (mountLocation) {
      mountLocation.appendChild(app);
    } else {
      console.error("挂载位置不存在，脚本可能已经失效！");
    }
    return app;
  })()
);
