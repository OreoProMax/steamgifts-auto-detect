<template>
  <img
    src="https://store.akamai.steamstatic.com/public/images/v6/ico/ico_info.png"
    alt="个人资料功能受限"
    :data-ui-tooltip="tooltipMsg"
    v-if="gameStatus === LIMITED_STATUS"
    width="100%"
  />

  <img
    src="https://store.akamai.steamstatic.com/public/images/v6/ico/ico_learning_about_game.png"
    alt="Steam 正在了解该游戏"
    :data-ui-tooltip="tooltipMsg"
    v-else-if="gameStatus === LEARNING_STATUS"
    width="100%"
  />

  <CircleCheck
    color="#66ff66"
    :data-ui-tooltip="tooltipMsg"
    v-else-if="gameStatus === NORMAL_STATUS"
    width="70%"
  />

  <CircleClose
    color="#ff6666"
    :data-ui-tooltip="tooltipMsg"
    v-else-if="gameStatus === 'error'"
    width="70%"
  />

  <Loading class="is-loading" v-else width="70%" />
</template>

<script lang="ts" setup>
// $ is the default alias of vite-plugin-monkey/dist/client
// if you want use 'others', set monkeyConfig.clientAlias='others'
import { GM } from "$";
import { ElLoading, ElMessage, ElNotification } from "element-plus";
import { onMounted, ref } from "vue";

// 项目全局变量
const LIMITED_STATUS = __LIMITED_STATUS__;
const LEARNING_STATUS = __LEARNING_STATUS__;
const NORMAL_STATUS = __NORMAL_STATUS__;

const loading = ElLoading.service({
  target: "div.featured__container",
  text: "检测中...",
  background: "rgba(0, 0, 0, 0.7)",
});

const gameStatus = ref("");
const tooltipMsg = ref("");

let headerHeight = 0;
let type = "";
let id = "";

/**
 * 请求URL网页内容。
 *
 * @param {string} url 目标URL。
 * @returns {Promise<Document>} 包含【目标URL的document对象】的Promise。
 */
function fetchUrl(url: string): Promise<Document> {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: "GET",
      url: url,
      onload: (response) => {
        resolve(response.responseXML!);
      },
      onerror: (response) => {
        reject(
          `${__SCRIPT_TITLE__}请求${url} 失败，请检查网络环境！\n${JSON.stringify(
            response
          )}`
        );
      },
    });
  });
}

/**
 * 根据Steam页面的document对象确定游戏状态。
 *
 * @param {Document} document Steam页面的document对象。
 * @returns {string} 检测出的游戏状态。
 */
function determineStatus(document: Document): string {
  // 确认页面是正常商店页面
  if (!document.querySelector("body.app")) {
    setError("传入的Steam页面检测异常");
    return "error";
  }

  // 检测是否受限
  const limitedElement = document.querySelector("div.learning_about");
  if (limitedElement) {
    const labelElement = limitedElement.querySelector("div.label")!;
    const textContent = labelElement.textContent!;
    if (textContent.includes("个人资料功能受限")) {
      return LIMITED_STATUS;
    } else if (textContent.includes("Steam 正在了解该游戏")) {
      return LEARNING_STATUS;
    }
  }
  return NORMAL_STATUS;
}

/**
 * 通过SteamDB检测游戏状态。
 *
 * @param {string} link SteamDB链接。
 * @returns {Promise<string>} 包含【目标游戏状态】的Promise。
 */
async function detectSteamdb(link: string): Promise<string> {
  GM.openInTab(link);
  loading.setText("正在等待SteamDB检测结果...");
  while (!(await GM.getValue(`${type}_${id}`, null))) {
    await sleep(100);
  }
  return GM.getValue(`${type}_${id}`, "error");
}

/**
 * 检测成功 - 设置游戏状态和展示信息。
 *
 * @param {string} status 游戏状态。
 * @param {boolean} isCache 游戏状态是否为从缓存中读取到的。
 * @param {string} customMsg 自定义消息。
 */
function setSuccess(status: string, isCache: boolean, customMsg: string): void {
  // 设置并缓存游戏状态
  gameStatus.value = status;
  if (!isCache) {
    GM.setValue(`${type}_${id}`, status);
  }

  // 生成展示信息
  let msg = isCache ? "缓存加载成功 - " : "页面检测成功 - ";
  if (customMsg !== "") {
    msg += customMsg;
  } else {
    msg += `${type}Id ${id}处于`;
    switch (status) {
      case LIMITED_STATUS:
        msg += " ❗ <span style='color: #ff0000'>个人资料功能受限</span> ";
        break;
      case LEARNING_STATUS:
        msg += " ❔ <span style='color: #808080'>Steam 正在了解该游戏</span> ";
        break;
      case NORMAL_STATUS:
        msg += " ✅ <span style='color: #00cc00'>正常</span> ";
        break;
    }
    msg += `状态`;
  }

  // 展示信息
  ElMessage({
    message: msg,
    type: "success",
    plain: true,
    dangerouslyUseHTMLString: true,
    duration: 0,
    showClose: true,
    offset: headerHeight,
  });
  tooltipMsg.value = `{"rows":[{"columns":[{"name" : "${msg}"}]}]}`;

  loading.close();
}

/**
 * 检测失败 - 抛出错误消息。
 *
 * @param {string} msg 错误消息。
 */
function setError(msg: string): void {
  msg += "，脚本可能已失效！";
  ElNotification({
    message: msg,
    type: "error",
    dangerouslyUseHTMLString: true,
    duration: 0,
    offset: headerHeight,
  });
  gameStatus.value = "error";
  tooltipMsg.value = `{"rows":[{"columns":[{"name" : "❌ ${msg}"}]}]}`;
  loading.close();
}

/**
 * 睡眠指定毫秒数
 *
 * @param {number} ms 睡眠时间（毫秒）。
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 主处理逻辑，检测一个Steam链接对应的游戏的状态。
 *
 * @param {string} link Steam链接。
 * @returns {Promise<string>} 包含【目标游戏状态】的Promise。
 */
async function processSteamLink(link: string): Promise<string> {
  // 1. 检测Steam链接类型是app还是sub，并提取出appId/subId
  const matchList = link.match(
    /https:\/\/store\.steampowered\.com\/(app|sub)\/(\d+)\//
  );
  if (matchList && matchList.length === 3) {
    type = matchList[1];
    id = matchList[2];
    ElMessage({
      message: `检测到${type}Id：${id}`,
      type: "success",
      offset: headerHeight,
    });
    await sleep(200);
  } else {
    setError("Steam链接类型检测异常");
    return "error";
  }

  // 2. 如果该游戏状态已有缓存，则处理缓存
  const cache = await GM.getValue(`${type}_${id}`, null);
  if (cache) {
    // 2.1 如果缓存为“error”或“正在了解”，清除该缓存
    if (cache === "error" || cache === LEARNING_STATUS) {
      GM.deleteValue(`${type}_${id}`);
    }
    // 2.2 否则，使用该缓存
    else {
      setSuccess(cache, true, "");
      return cache;
    }
  }

  // 3. 请求Steam页面
  console.log(`请求Steam页面：${link}`);
  const steamDocument = await fetchUrl(link);

  // 4. 处理sub型商店页面
  if (type === "sub") {
    // 4.1 如果Steam页面为主页（说明该sub无商店页面），则通过SteamDB检测
    if (steamDocument.querySelector("body.infinite_scrolling")) {
      const steamdbLink = `https://steamdb.info/sub/${id}/apps?steamgifts-auto-detect`;
      const status = await detectSteamdb(steamdbLink);
      setSuccess(status, false, "");
      return status;
    }

    // 4.2 提取sub中包含的所有app的链接，逐个检测
    const linksElement = steamDocument.querySelectorAll("a.tab_item_overlay");
    if (linksElement.length === 0) {
      setError("sub商店页面检测异常");
      return "error";
    }
    const links = Array.from(linksElement).map(
      (element) => element.getAttribute("href")!
    );
    const results = [];
    for (let i = 0; i < links.length; i++) {
      const result = await processSteamLink(links[i]);
      results.push(result);
      await sleep(1000);
      ElMessage.closeAll();
    }

    // 4.3 只要有一个error，就认定为error
    if (results.includes("error")) {
      setError("sub中的app检测异常");
      return "error";
    }

    // 4.4 没有error，则生成检测成功的展示消息
    let normalCount = 0;
    let limitedCount = 0;
    let learningCount = 0;
    results.forEach((result) => {
      switch (result) {
        case LIMITED_STATUS:
          limitedCount++;
          break;
        case LEARNING_STATUS:
          learningCount++;
          break;
        case NORMAL_STATUS:
          normalCount++;
          break;
      }
    });
    const msg = `正常${normalCount}/${results.length}个，受限${limitedCount}/${results.length}个，正在了解${learningCount}/${results.length}个`;

    // 4.5 只要有一个正常，就认定为正常
    if (results.includes(NORMAL_STATUS)) {
      setSuccess(NORMAL_STATUS, false, msg);
      return NORMAL_STATUS;
    }

    // 4.6 只要有一个正在了解，就认定为正在了解
    if (results.includes(LEARNING_STATUS)) {
      setSuccess(LEARNING_STATUS, false, msg);
      return LEARNING_STATUS;
    }

    // 4.7 全部受限，才认定为受限
    setSuccess(LIMITED_STATUS, false, msg);
    return LIMITED_STATUS;
  }

  // 5. 确定app型商店页面的类型（正常页面、锁区页面、无商店页面）
  let pageType = "";
  let checkBit = 0;
  // 正常页面
  if (steamDocument.querySelector("body.app")) {
    pageType = "app";
    checkBit++;
  }
  // 锁区页面
  if (steamDocument.querySelector("body.redeemwalletcode")) {
    pageType = "region_restricted";
    checkBit++;
  }
  // 无商店页面（跳转到Steam主页）
  if (steamDocument.querySelector("body.infinite_scrolling")) {
    pageType = "not_exist";
    checkBit++;
  }
  // 如果checkBit不等于1，就说明出现了异常
  if (checkBit !== 1) {
    setError("app商店页面检测异常");
    return "error";
  }

  // 6. 根据app型商店页面的类型检测游戏状态
  let status;
  let steamdbLink;
  switch (pageType) {
    // 正常页面：直接检测
    case "app":
      status = determineStatus(steamDocument);
      setSuccess(status, false, "");
      return status;
      break;

    // 锁区页面：通过SteamDB检测
    case "region_restricted":
      steamdbLink = `https://steamdb.info/app/${id}?steamgifts-auto-detect`;
      status = await detectSteamdb(steamdbLink);
      setSuccess(status, false, "");
      return status;
      break;

    // 无商店页面（跳转到Steam主页）：通过Barter.vg和SteamDB检测
    case "not_exist":
      // A. 请求Barter.vg页面
      const bartervgLink = `https://barter.vg/steam/app/${id}`;
      const bartervgDocument = await fetchUrl(bartervgLink);

      // B. 确认Barter.vg页面正常
      const bartervgAppId = bartervgDocument
        .querySelector("div#main")!
        .getAttribute("data-sku");
      if (bartervgAppId !== id) {
        setError("Barter.vg页面检测异常");
        return "error";
      }
      const bartervgStatusElement = bartervgDocument.querySelector(
        "div.platform>strong"
      );
      if (!bartervgStatusElement) {
        setError(
          `商店页面已移除，但
          <a href="${bartervgLink}" style="color: #409eff" target="_blank">Barter.vg</a>
          尚未更新数据，请手动检查！
          <!--`
        );
        return "error";
      }

      // C. 通过Barter.vg检测游戏是否被ban
      const bartervgStatus = bartervgStatusElement.textContent!;
      if (bartervgStatus.includes("Banned")) {
        setSuccess(LIMITED_STATUS, false, "");
        return LIMITED_STATUS;
      }
      // 如果不包含Banned，那么应该包含Delisted，否则就说明发生了错误
      else if (!bartervgStatus.includes("Delisted")) {
        setError("Barter.vg游戏状态检测异常");
        return "error";
      }

      // D. 如果没被ban，再通过SteamDB检测
      steamdbLink = `https://steamdb.info/app/${id}?steamgifts-auto-detect`;
      status = await detectSteamdb(steamdbLink);
      setSuccess(status, false, "");
      return status;
      break;
  }

  setError("未知错误");
  return "error";
}

/**
 * 脚本的入口
 */
function main(): void {
  // 从页面中提取出Steam链接
  let link = "";
  // 【herf属性以https://store.steampowered.com/为开头】的<a>元素
  const linkElement = document.querySelector(
    "a[href^='https://store.steampowered.com/']"
  );
  if (linkElement) {
    // !是非空断言，表示表达式不为null或undefined
    link = linkElement.getAttribute("href")!;
  } else {
    setError("未找到页面中的Steam链接");
    return;
  }
  // 处理Steam链接
  processSteamLink(link);
}

onMounted(() => {
  console.log("Detector mounted");
  // 获取header高度
  headerHeight = document.querySelector("header")!.clientHeight;
  main();
});
</script>

<style scoped>
.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
