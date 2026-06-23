import { CARRIERS } from "./carrier.js";
import { detectCarrier } from "./detector.js";
import { fetchStatus } from "./scraper.js";
import { getSavedItems, addSavedItem, removeSavedItem } from "./storage.js";
import { buildUrl, getCarrierLabel, formatUrlDisplay, buildPlainText } from "./url-builder.js";
import { validateTrackingNumber } from "./validator.js";

let selectedCarrier = "sagawa";
let selectedAction = "navigate";
let selectedDirection = "shipping";
const actionBtns = document.querySelectorAll(".action-btn");
const directionBtns = document.querySelectorAll(".direction-btn");
const urlOutput = document.getElementById("urlOutput");
const statusOutput = document.getElementById("statusOutput");
const urlDisplay = document.getElementById("urlDisplay");
const copyBtn = document.getElementById("copyBtn");
const copyTextBtn = document.getElementById("copyTextBtn");
const trackingInput = document.getElementById("trackingNumber");
const memoInput = document.getElementById("memo");
const dateSlotInput = document.getElementById("dateSlot");
const sizeInput = document.getElementById("size");
const itemCountInput = document.getElementById("itemCount");
const checkBtn = document.getElementById("checkBtn");
const errorMessage = document.getElementById("errorMessage");
const toggleBtns = document.querySelectorAll(".toggle-btn");
const savedList = document.getElementById("savedList");
const savedCount = document.getElementById("savedCount");
const detectBadge = document.getElementById("detectBadge");

const MAX_SAVED = 8;
let detectTimeout = null;

function renderSaved() {
  const savedItems = getSavedItems();
  savedCount.textContent = `${savedItems.length} / ${MAX_SAVED}`;
  if (savedItems.length === 0) {
    savedList.innerHTML = '<p class="saved-empty">保存された追跡番号はありません</p>';
    return;
  }
  savedList.innerHTML = savedItems
    .map(
      (item, i) => `
    <div class="saved-item" data-index="${i}">
      <div class="saved-item-text">
        <span class="saved-item-carrier">${getCarrierLabel(item.carrier)}</span>
        ${item.memo ? ` ${item.memo}` : ""} - ${item.trackingNumber}
      </div>
      <button class="saved-item-delete" data-index="${i}">✕</button>
    </div>
  `,
    )
    .join("");

  savedList.querySelectorAll(".saved-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.classList.contains("saved-item-delete")) return;
      const idx = parseInt(el.dataset.index);
      const item = getSavedItems()[idx];
      const url = buildUrl(item.carrier, item.trackingNumber.replace(/-/g, ""));
      window.open(url, "_blank");
    });
  });

  savedList.querySelectorAll(".saved-item-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      removeSavedItem(idx);
      renderSaved();
    });
  });
}

toggleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    toggleBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCarrier = btn.dataset.carrier;
    errorMessage.classList.remove("show");
    if (detectBadge) detectBadge.classList.remove("show");
  });
});

actionBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    actionBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedAction = btn.dataset.action;
    urlOutput.classList.remove("show");
    if (statusOutput) statusOutput.classList.remove("show");
  });
});

directionBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    directionBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedDirection = btn.dataset.direction;
  });
});

copyBtn.addEventListener("click", async () => {
  const url = urlDisplay.querySelector("a")?.href || urlDisplay.textContent.trim();
  try {
    await navigator.clipboard.writeText(url);
    copyBtn.textContent = "コピーしました！";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.textContent = "URLをコピー";
      copyBtn.classList.remove("copied");
    }, 2000);
  } catch (err) {
    alert("コピーに失敗しました");
  }
});

copyTextBtn.addEventListener("click", async () => {
  const url = urlDisplay.querySelector("a")?.href || urlDisplay.textContent.trim();
  const text = buildPlainText(
    selectedDirection,
    dateSlotInput.value.trim(),
    sizeInput.value.trim(),
    itemCountInput.value.trim(),
    selectedCarrier,
    trackingInput.value.trim(),
    url,
  );
  try {
    await navigator.clipboard.writeText(text);
    copyTextBtn.textContent = "コピーしました！";
    copyTextBtn.classList.add("copied");
    setTimeout(() => {
      copyTextBtn.textContent = "テキスト全体をコピー";
      copyTextBtn.classList.remove("copied");
    }, 2000);
  } catch (err) {
    alert("コピーに失敗しました");
  }
});

checkBtn.addEventListener("click", async () => {
  const trackingNumber = trackingInput.value.trim();
  if (!trackingNumber) {
    errorMessage.classList.add("show");
    trackingInput.focus();
    return;
  }
  errorMessage.classList.remove("show");
  const cleanedNumber = trackingNumber.replace(/-/g, "");

  const validation = validateTrackingNumber(selectedCarrier, cleanedNumber);
  if (!validation.isValid) {
    errorMessage.textContent = validation.message;
    errorMessage.classList.add("show");
    trackingInput.focus();
    return;
  }

  const memo = memoInput.value.trim();
  addSavedItem(selectedCarrier, memo, trackingNumber, MAX_SAVED);
  renderSaved();

  if (selectedAction === "navigate") {
    const url = buildUrl(selectedCarrier, cleanedNumber);
    window.open(url, "_blank");
    urlOutput.classList.remove("show");
    if (statusOutput) statusOutput.classList.remove("show");
  } else if (selectedAction === "show-url") {
    const url = buildUrl(selectedCarrier, cleanedNumber);
    urlDisplay.innerHTML = formatUrlDisplay(
      selectedCarrier,
      trackingNumber,
      url,
      selectedDirection,
      dateSlotInput.value.trim(),
      sizeInput.value.trim(),
      itemCountInput.value.trim(),
    );
    urlOutput.classList.add("show");
    if (statusOutput) statusOutput.classList.remove("show");
  } else if (selectedAction === "check-status") {
    urlOutput.classList.remove("show");
    await checkStatus(selectedCarrier, cleanedNumber, trackingNumber);
  }
});

async function checkStatus(carrier, cleanedNumber, displayNumber) {
  if (!statusOutput) return;

  statusOutput.innerHTML = `
    <div class="status-header">
      <span class="status-label">📡 ステータス確認中...</span>
    </div>
    <div class="status-body">
      <div class="status-loading">照会しています…</div>
    </div>
  `;
  statusOutput.classList.add("show");

  const result = await fetchStatus(carrier, cleanedNumber);

  if (result.notReady) {
    statusOutput.innerHTML = `
      <div class="status-header">
        <span class="status-label">📡 ステータス確認</span>
      </div>
      <div class="status-body">
        <div class="status-unavailable">
          ステータス確認機能は準備中です。<br>
          代わりに「ページ遷移」で追跡サイトを開いてください。
        </div>
      </div>
    `;
    return;
  }

  if (result.error) {
    statusOutput.innerHTML = `
      <div class="status-header">
        <span class="status-label">📡 ステータス確認</span>
        <span class="status-carrier">${getCarrierLabel(carrier)}</span>
      </div>
      <div class="status-body">
        <div class="status-error">エラー: ${result.error}</div>
      </div>
    `;
    return;
  }

  renderGenericStatus(result, carrier, displayNumber);
}

function getStatusIcon(carrier) {
  return CARRIERS[carrier]?.icon || "📦";
}

function renderGenericStatus(result, carrier, displayNumber) {
  const info = result.info || {};
  const latest = result.latest || {};
  const history = result.history || [];
  const icon = getStatusIcon(carrier);

  let historyHtml = "";
  if (history.length > 0) {
    historyHtml = `
      <details class="status-history">
        <summary>📋 履歴（${history.length}件）</summary>
        ${history
          .map(
            (h) => `
          <div class="status-history-item">
            <span class="history-date">${h.date || ""} ${h.time || ""}</span>
            <span class="history-status">${h.status || ""}</span>
            <span class="history-office">${h.office || ""}</span>
          </div>
        `,
          )
          .join("")}
      </details>
    `;
  }

  statusOutput.innerHTML = `
    <div class="status-header">
      <span class="status-label">📡 ステータス確認</span>
      <span class="status-carrier">${icon} ${getCarrierLabel(carrier)}</span>
    </div>
    <div class="status-body">
      <div class="status-main">
        <span class="status-marker">●</span>
        <span class="status-text">${latest.status || info.status || "—"}</span>
      </div>
      <div class="status-details">
        ${info.shipDate ? `<span>📅 出荷日: ${info.shipDate}</span>` : ""}
        ${info.date ? `<span>📅 ${info.date}</span>` : ""}
        ${info.type ? `<span>📦 ${info.type}</span>` : ""}
        ${info.office ? `<span>🏢 ${info.office}</span>` : ""}
        ${info.prefecture ? `<span>📍 ${info.prefecture}</span>` : ""}
        ${info.itemCount ? `<span>📊 ${info.itemCount}</span>` : ""}
        ${info.number ? `<span>🔢 ${info.number}</span>` : ""}
      </div>
    </div>
    ${historyHtml}
    <div class="status-footer">
      <a href="${buildUrl(carrier, displayNumber.replace(/-/g, ""))}" target="_blank" class="status-link">
        ${getCarrierLabel(carrier)}のサイトで開く →
      </a>
    </div>
  `;
}

// ── Auto-detection on input ──
trackingInput.addEventListener("input", (e) => {
  errorMessage.classList.remove("show");
  // Allow digits, letters (for JP post alpha format), and hyphens
  e.target.value = e.target.value.replace(/[^0-9A-Za-z-]/g, "");

  // Debounced detection
  clearTimeout(detectTimeout);
  detectTimeout = setTimeout(() => {
    const val = e.target.value.trim();
    const detected = detectCarrier(val);
    if (detected) {
      toggleBtns.forEach((b) => b.classList.remove("active"));
      toggleBtns.forEach((b) => {
        if (b.dataset.carrier === detected) {
          b.classList.add("active");
          selectedCarrier = detected;
        }
      });
      if (detectBadge) {
        const cfg = CARRIERS[detected];
        detectBadge.textContent = `${cfg.icon} ${cfg.label}を検出`;
        detectBadge.classList.add("show");
        setTimeout(() => detectBadge.classList.remove("show"), 3000);
      }
    }
  }, 400);
});

trackingInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") checkBtn.click();
});

renderSaved();
