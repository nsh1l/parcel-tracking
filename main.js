import { CARRIERS } from "./carrier.js";
import { detectCarrier } from "./detector.js";
import { fetchAllStatuses } from "./scraper.js";
import { getSavedItems, addSavedItem, removeSavedItem } from "./storage.js";
import { buildUrl, carrierLabel, format } from "./url-builder.js";
import { validateTrackingNumber } from "./validator.js";

let selectedCarrier = "sagawa";
let selectedAction = "check-status";
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
        <span class="saved-item-carrier">${escapeHtml(carrierLabel(item.carrier))}</span>
        ${item.memo ? ` ${escapeHtml(item.memo)}` : ""} - ${escapeHtml(item.trackingNumber)}
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
  const cleanedNumber = trackingNumber.replace(/-/g, "").trim().toUpperCase();
  const memo = memoInput.value.trim();

  // ステータス確認は選択中の業者に絞らず、全業者を照会する。
  if (selectedAction === "check-status") {
    urlOutput.classList.remove("show");
    checkBtn.disabled = true;
    try {
      const result = await checkAllStatuses(cleanedNumber, trackingNumber);
      // ヒットした業者だけを履歴へ保存する（選択中チップを誤保存しない）。
      if (result?.hits?.length) {
        result.hits.forEach((hit) => {
          addSavedItem(
            hit.carrier,
            memo,
            trackingNumber,
            MAX_SAVED,
            selectedDirection,
          );
        });
        renderSaved();
      }
    } finally {
      checkBtn.disabled = false;
    }
    return;
  }

  const validation = validateTrackingNumber(selectedCarrier, cleanedNumber);
  if (!validation.isValid) {
    errorMessage.textContent = validation.message;
    errorMessage.classList.add("show");
    trackingInput.focus();
    return;
  }

  addSavedItem(selectedCarrier, memo, trackingNumber, MAX_SAVED, selectedDirection);
  renderSaved();

  if (selectedAction === "show-url") {
    // format(..., "html") escapes all user-controlled values before insertion.
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
  }
});

async function checkAllStatuses(cleanedNumber, displayNumber) {
  if (!statusOutput) return { error: "結果表示領域が見つかりません" };

  statusOutput.innerHTML = `
    <div class="url-label">📡 全業者を確認中...</div>
    <div class="url-display status-message status-message-muted">${escapeHtml(displayNumber)} を照会しています…</div>
  `;
  statusOutput.classList.add("show");

  const result = await fetchAllStatuses(cleanedNumber);

  if (result.notReady) {
    statusOutput.innerHTML = `
      <div class="url-label">📡 ステータス確認</div>
      <div class="url-display status-message status-message-muted">
        ステータス確認機能は準備中です。<br>
        「URL」に切り替えると共有用URLを確認できます。
      </div>
    `;
    return result;
  }

  if (result.error) {
    statusOutput.innerHTML = `
      <div class="url-label">📡 ステータス確認</div>
      <div class="url-display status-message status-message-error">エラー: ${escapeHtml(result.error)}</div>
    `;
    return result;
  }

  const hits = Array.isArray(result.hits)
    ? result.hits.filter((hit) => CARRIERS[hit.carrier])
    : [];

  if (hits.length === 0) {
    const checkedCount = result.checked?.length || Object.keys(CARRIERS).length;
    const errorCount = result.errors?.length || 0;
    statusOutput.innerHTML = `
      <div class="url-label">📡 ヒットした配送業者</div>
      <div class="url-display status-message status-message-muted">
        ${checkedCount}社を確認しましたが、追跡情報は見つかりませんでした。<br>
        ${errorCount ? `${errorCount}社は照会エラーまたは未対応です。` : "番号と配送業者の組み合わせをご確認ください。"}
      </div>
    `;
    return { ...result, hits };
  }

  statusOutput.innerHTML = `
    <div class="url-label">📡 ヒットした配送業者（${hits.length}社）</div>
    ${hits.map((hit) => renderStatusCard(hit, displayNumber)).join("")}
  `;
  return { ...result, hits };
}

function renderStatusCard(result, displayNumber) {
  const carrier = result.carrier;
  const info = result.info || {};
  const latest = result.latest || {};
  const history = Array.isArray(result.history) ? result.history : [];
  const url = buildUrl(carrier, displayNumber);
  const status = latest.status || info.status || "追跡情報あり";
  const infoHtml = Object.entries(info)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([key, value]) =>
        `<span><b>${escapeHtml(key)}</b>: ${escapeHtml(value)}</span>`,
    )
    .join("");
  const historyHtml = history.length
    ? `
      <details class="status-history">
        <summary class="status-history-summary">📋 履歴（${history.length}件）</summary>
        ${history
          .map(
            (event) => `
          <div class="status-event">
            <span class="status-event-date">${escapeHtml(`${event.date || ""} ${event.time || ""}`)}</span>
            <span class="status-event-status">${escapeHtml(event.status || "")}</span>
            <span>${escapeHtml(event.office || "")}</span>
          </div>
        `,
          )
          .join("")}
      </details>
    `
    : "";

  return `
    <article class="status-card" data-carrier="${escapeHtml(carrier)}">
      <div class="status-card-title">${escapeHtml(getStatusIcon(carrier))} ${escapeHtml(carrierLabel(carrier))}</div>
      <div class="status-card-latest">● ${escapeHtml(status)}</div>
      <div class="status-card-info">${infoHtml || `<span>🔢 ${escapeHtml(displayNumber)}</span>`}</div>
      ${historyHtml}
      ${url ? `<a class="status-card-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(carrierLabel(carrier))}のサイトで開く →</a>` : ""}
    </article>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getStatusIcon(carrier) {
  return CARRIERS[carrier]?.icon || "📦";
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