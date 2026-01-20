/**
 * Utility Functions
 * 工具函數庫
 */

/**
 * 防抖函數
 */
function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 節流函數
 */
function throttle(fn, limit = 100) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 格式化數字
 */
function formatNumber(num) {
  return num.toLocaleString('zh-TW');
}

/**
 * 格式化大數字 (K, M, B)
 */
function formatLargeNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

/**
 * 格式化時間戳記
 */
function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
}

/**
 * 格式化持續時間
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * 二進位字串格式化（每 4 位一組）
 */
function formatBinary(binary, groupSize = 4) {
  const groups = [];
  for (let i = 0; i < binary.length; i += groupSize) {
    groups.push(binary.substring(i, i + groupSize));
  }
  return groups.join(' ');
}

/**
 * 複製到剪貼簿
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * 產生隨機 ID（用於 DOM 元素）
 */
function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 解析日期時間輸入
 */
function parseDateTimeInput(input) {
  if (input instanceof Date) return input.getTime();
  if (typeof input === 'number') return input;
  if (typeof input === 'string') {
    const parsed = Date.parse(input);
    if (!isNaN(parsed)) return parsed;
  }
  return Date.now();
}

/**
 * 取得日期時間輸入的格式化字串（用於 datetime-local input）
 */
function toDateTimeLocalString(date) {
  const d = new Date(date);
  const pad = (n) => n.toString().padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 計算時間差（人類可讀格式）
 */
function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  const intervals = [
    { label: '年', seconds: 31536000 },
    { label: '個月', seconds: 2592000 },
    { label: '天', seconds: 86400 },
    { label: '小時', seconds: 3600 },
    { label: '分鐘', seconds: 60 },
    { label: '秒', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}前`;
    }
  }

  return '剛剛';
}

/**
 * 驗證數字範圍
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 安全地解析整數
 */
function safeParseInt(value, defaultValue = 0) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 安全地解析 BigInt
 */
function safeParseBigInt(value, defaultValue = 0n) {
  try {
    return BigInt(value);
  } catch {
    return defaultValue;
  }
}

/**
 * 延遲執行
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重試函數
 */
async function retry(fn, maxAttempts = 3, delayMs = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await delay(delayMs * attempt);
      }
    }
  }

  throw lastError;
}

/**
 * 偵測瀏覽器是否支援某功能
 */
const browserSupport = {
  bigInt: typeof BigInt !== 'undefined',
  clipboard: typeof navigator.clipboard !== 'undefined',
  intersectionObserver: typeof IntersectionObserver !== 'undefined',
  customElements: typeof customElements !== 'undefined'
};

/**
 * 檢查是否為行動裝置
 */
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 檢查是否偏好減少動畫
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 取得 URL 參數
 */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/**
 * 更新 URL 參數（不重新載入頁面）
 */
function updateUrlParam(key, value) {
  const url = new URL(window.location);
  if (value === null || value === undefined) {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(key, value);
  }
  window.history.replaceState({}, '', url);
}

/**
 * DOM 元素是否在視窗內
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * 建立 DOM 元素
 */
function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }

  return element;
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    debounce,
    throttle,
    formatNumber,
    formatLargeNumber,
    formatTimestamp,
    formatDuration,
    formatBinary,
    copyToClipboard,
    generateId,
    parseDateTimeInput,
    toDateTimeLocalString,
    timeAgo,
    clamp,
    safeParseInt,
    safeParseBigInt,
    delay,
    retry,
    browserSupport,
    isMobile,
    prefersReducedMotion,
    getUrlParams,
    updateUrlParam,
    isInViewport,
    createElement
  };
}
