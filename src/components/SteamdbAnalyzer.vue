<script lang="ts" setup>
import { GM } from "$";
import { ElMessage, ElNotification } from "element-plus";
import { onMounted } from "vue";

// 项目全局变量
const LIMITED_STATUS = __LIMITED_STATUS__;
const LEARNING_STATUS = __LEARNING_STATUS__;
const NORMAL_STATUS = __NORMAL_STATUS__;

/**
 * 检测失败 - 抛出错误消息。
 *
 * @param {string} msg 错误消息。
 */
function setError(msg: string): void {
  ElNotification({
    message: msg,
    type: "error",
    duration: 0,
  });
}

/**
 * 睡眠指定毫秒数
 *
 * @param {number} ms 睡眠时间（毫秒）。
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

onMounted(async () => {
  // 0. 只有URL以?steamgifts-auto-detect结尾（说明是脚本跳转过来的），才运行脚本
  const url = window.location.href;
  if (!url.endsWith("?steamgifts-auto-detect")) {
    return;
  } else {
    console.log("SteamdbAnalyzer mounted");
  }

  // TODO: 有时候没弹出通知，可能是因为页面还没加载完
  // 1. 检测当前访问是否卡了CF人机验证
  if (document.querySelector("div.cf-error")) {
    setError("请完成Cloudflare人机验证！");
    return;
  }

  // 2. 检测页面种类是app还是sub，并提取出appId/subId
  let type = "";
  let id = "";
  const matchList = url.match(/https:\/\/steamdb\.info\/(app|sub)\/(\d+)\//);
  if (matchList && matchList.length === 3) {
    type = matchList[1];
    id = matchList[2];
  } else {
    setError("未能正确匹配SteamDB链接类型，脚本可能已失效！");
    return;
  }

  // 3. app页面：检测游戏状态
  if (type === "app") {
    // 检测页面是否有受限元素
    if (document.querySelector("a[aria-label='Profile Features Limited']")) {
      GM.setValue(`${type}_${id}`, LIMITED_STATUS);
    }
    // 检测页面是否有正在了解元素
    else if (document.querySelector("a[aria-label='Steam is learning']")) {
      GM.setValue(`${type}_${id}`, LEARNING_STATUS);
    }
    // 如果都没有，说明状态为正常
    else {
      GM.setValue(`${type}_${id}`, NORMAL_STATUS);
    }
  }

  // 4. sub页面：检测包含的app的状态
  if (type === "sub") {
    // 4.1 提取出所有appId
    const trElements = document.querySelectorAll("tr.app");
    const appIds = Array.from(trElements).map((tr) =>
      tr.getAttribute("data-appid")
    );

    // 4.2 遍历每个app，检测状态
    const results = [];
    for (const appId of appIds) {
      let status = await GM.getValue(`app_${appId}`, "error");

      // 如果该app状态已有缓存，且不为“error”或“正在了解”，则直接使用缓存
      if (status && status !== "error" && status !== LEARNING_STATUS) {
      }
      // 否则，通过SteamDB检测
      else {
        // 打开SteamDB页面
        const steamdbLink = `https://steamdb.info/app/${appId}/?steamgifts-auto-detect`;
        GM.openInTab(steamdbLink);

        // 等待检测结果
        while (!(await GM.getValue(`app_${appId}`, null))) {
          await sleep(100);
        }
        status = await GM.getValue(`app_${appId}`, "error");
      }

      // 将检测结果存入results
      results.push(status);

      // 展示成功信息
      const headerHeight = document.querySelector("div.header")!.clientHeight;
      ElMessage({
        message: `App ${appId} 检测完毕，状态 - ${status}`,
        type: "success",
        offset: headerHeight,
      });
    }

    // 4.3 决定sub的状态
    // A. 只要有一个error，就认定为error
    if (results.includes("error")) {
      setError("sub中的app检测异常");
    }
    // B. 只要有一个正常，就认定为正常
    else if (results.includes(NORMAL_STATUS)) {
      GM.setValue(`${type}_${id}`, NORMAL_STATUS);
    }
    // C. 只要有一个正在了解，就认定为正在了解
    else if (results.includes(LEARNING_STATUS)) {
      GM.setValue(`${type}_${id}`, LEARNING_STATUS);
    }
    // D. 全部受限，才认定为受限
    else {
      GM.setValue(`${type}_${id}`, LIMITED_STATUS);
    }
  }

  // 5. 关闭页面
  window.close();
});
</script>
