<script lang="ts" setup>
import { ElNotification } from "element-plus";
import { onMounted } from "vue";

import { GM } from "$";

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

onMounted(() => {
  // 0. 只有URL以?steamgifts-auto-detect结尾（说明是脚本跳转过来的），才运行脚本
  const url = window.location.href;
  if (!url.endsWith("?steamgifts-auto-detect")) {
    return;
  } else {
    console.log("SteamdbAnalyzer mounted");
  }

  // 1. 检测当前访问是否卡了CF人机验证
  if (!document.querySelector("body.page-apps")) {
    setError("请完成Cloudflare人机验证！");
    return;
  }

  // 2. 检测访问链接的种类是app还是sub，并提取出appId/subId
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

  // 3. 检测游戏类型
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

  // 4. 关闭页面
  window.close();
});
</script>
