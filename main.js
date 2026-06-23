import { CARRIERS } from "./carrier.js";
import { detectCarrier } from "./detector.js";
import { fetchStatus } from "./scraper.js";
import { getSavedItems, addSavedItem, removeSavedItem } from "./storage.js";
import { buildUrl, carrierLabel, format } from "./url-builder.js";
import { validateTrackingNumber } from "./validator.js";

let selectedCarrier = "sagawa";
let selectedAction = "navigate";
let selectedDirection = "shipping";

const carrierChips = document.querySelectorAll(".chip[data-carrier]");
const actionBtns = document.querySelectorAll(".seg-btn[data-action]");
const directionBtns = document.querySelectorAll(".seg-btn[data-direction]");
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
const savedList = document.getElementById("savedList");
const savedCount = document.getElementById("savedCount");
const detectBadge = document.getElementById("detectBadge");
const detailsToggle = document.getElementById("detailsToggle");
const detailsBody = document.getElementById("detailsBody");

const MAX_SAVED = 8;
let detectTimeout = null;

// ── Details collapsible (handled via inline onclick in HTML) ──

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
    <div class="saved-item ${item.direction === "receiving" ? "receiving" : "shipping"}" data-index="${i}">
      <span class="saved-item-dir">${item.direction === "receiving" ? "📥" : "📤"}</span>
      <div class="saved-item-text">
        <span class="saved-item-carrier">${carrierLabel(item.carrier)}</span>
        ${item.memo ? ` ${item.memo}` : ""} - ${item.trackingNumber}
      </div>
      <button class="saved-item-del" data-index="${i}">✕</button>
    </div>
  `,
    )
    .join("");

  savedList.querySelectorAll(".saved-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.classList.contains("saved-item-del")) return;
      const idx = parseInt(el.dataset.index);
      const item = getSavedItems()[idx];
      const url = buildUrl(item.carrier, item.trackingNumber.replace(/-/g, ""));
      window.open(url, "_blank");
    });
  });

  savedList.querySelectorAll(".saved-item-del").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      removeSavedItem(idx);
      renderSaved();
    });
  });
}

// ── Carrier chip selection ──
carrierChips.forEach((btn) => {
  btn.addEventListener("click", () => {
    carrierChips.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCarrier = btn.dataset.carrier;
    errorMessage.classList.remove("show");
    if (detectBadge) detectBadge.classList.remove("show");
  });
});

// ── Action selection ──
actionBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    actionBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedAction = btn.dataset.action;
    urlOutput.classList.remove("show");
    if (statusOutput) statusOutput.classList.remove("show");
  });
});

// ── Direction selection ──
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
  const text = format({
    carrier: selectedCarrier,
    number: trackingInput.value.trim(),
    dateSlot: dateSlotInput.value.trim(),
    size: sizeInput.value.trim(),
    itemCount: itemCountInput.value.trim(),
  });
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
  addSavedItem(selectedCarrier, memo, trackingNumber, MAX_SAVED, selectedDirection);
  renderSaved();

  if (selectedAction === "navigate") {
    const url = buildUrl(selectedCarrier, cleanedNumber);
    window.open(url, "_blank");
    urlOutput.classList.remove("show");
    if (statusOutput) statusOutput.classList.remove("show");
  } else if (selectedAction === "show-url") {
    urlDisplay.innerHTML = format({
      carrier: selectedCarrier,
      number: trackingNumber,
      dateSlot: dateSlotInput.value.trim(),
      size: sizeInput.value.trim(),
      itemCount: itemCountInput.value.trim(),
      format: "html",
    });
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
    <div class="url-label">📡 ステータス確認中...</div>
    <div class="url-display" style="color: var(--border);">照会しています…</div>
  `;
  statusOutput.classList.add("show");

  const result = await fetchStatus(carrier, cleanedNumber);

  if (result.notReady) {
    statusOutput.innerHTML = `
      <div class="url-label">📡 ステータス確認</div>
      <div class="url-display" style="color: var(--border);">
        ステータス確認機能は準備中です。<br>
        代わりに「遷移」で追跡サイトを開いてください。
      </div>
    `;
    return;
  }

  if (result.error) {
    statusOutput.innerHTML = `
      <div class="url-label">📡 ステータス確認</div>
      <div class="url-display" style="color: var(--error);">エラー: ${result.error}</div>
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
      <details class="status-history" style="margin-top: 8px;">
        <summary style="cursor: pointer; font-weight: 600; color: var(--accent); padding: 4px 0;">📋 履歴（${history.length}件）</summary>
        ${history
          .map(
            (h) => `
          <div style="display: flex; gap: 12px; padding: 4px 0; border-bottom: 1px solid var(--border-light); font-size: 12px;">
            <span style="color: var(--border); min-width: 100px;">${h.date || ""} ${h.time || ""}</span>
            <span style="color: var(--text); font-weight: 600; flex: 1;">${h.status || ""}</span>
            <span style="color: var(--text-muted);">${h.office || ""}</span>
          </div>
        `,
          )
          .join("")}
      </details>
    `;
  }

  statusOutput.innerHTML = `
    <div class="url-label">📡 ${icon} ${carrierLabel(carrier)}</div>
    <div class="url-display" style="color: var(--text);">
      <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px;">● ${latest.status || info.status || "—"}</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px 16px; font-size: 12px; color: var(--text-muted);">
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
    <div style="text-align: right; margin-top: 8px;">
      <a href="${buildUrl(carrier, displayNumber.replace(/-/g, ""))}" target="_blank" style="font-size: 12px; color: var(--accent); text-decoration: underline;">
        ${carrierLabel(carrier)}のサイトで開く →
      </a>
    </div>
  `;
}

// ── Auto-detection on input ──
trackingInput.addEventListener("input", (e) => {
  errorMessage.classList.remove("show");
  e.target.value = e.target.value.replace(/[^0-9A-Za-z-]/g, "");

  clearTimeout(detectTimeout);
  detectTimeout = setTimeout(() => {
    const val = e.target.value.trim();
    const detected = detectCarrier(val);
    if (detected) {
      carrierChips.forEach((b) => b.classList.remove("active"));
      carrierChips.forEach((b) => {
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

// ── Numeric-only inputs for size & itemCount ──
[sizeInput, itemCountInput].forEach((input) => {
  input.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  });
});

renderSaved();