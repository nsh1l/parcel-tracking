import { CARRIERS } from "./carriers.js";

let selectedCarrier = "sagawa";
let selectedAction = "navigate";
const actionBtns = document.querySelectorAll(".action-btn");
const urlOutput = document.getElementById("urlOutput");
const urlDisplay = document.getElementById("urlDisplay");
const copyBtn = document.getElementById("copyBtn");
const trackingInput = document.getElementById("trackingNumber");
const memoInput = document.getElementById("memo");
const checkBtn = document.getElementById("checkBtn");
const errorMessage = document.getElementById("errorMessage");
const toggleBtns = document.querySelectorAll(".toggle-btn");
const savedList = document.getElementById("savedList");
const savedCount = document.getElementById("savedCount");

const label = CARRIERS[item.carrier]?.label ?? item.carrier;

const MAX_SAVED = 8;

// ローカルストレージから保存データ読み込み
let savedItems = JSON.parse(localStorage.getItem("savedTrackings") || "[]");

// buildUrl関数はシンプルに
function buildUrl(carrier, cleanedNumber) {
  return CARRIERS[carrier]?.buildUrl(cleanedNumber) ?? null;
}
// ラベル参照も

function saveToStorage() {
  localStorage.setItem("savedTrackings", JSON.stringify(savedItems));
}

function renderSaved() {
  savedCount.textContent = `${savedItems.length} / ${MAX_SAVED}`;
  if (savedItems.length === 0) {
    savedList.innerHTML =
      '<p class="saved-empty">保存された追跡番号はありません</p>';
    return;
  }
  savedList.innerHTML = savedItems
    .map(
      (item, i) => `
    <div class="saved-item" data-index="${i}">
      <div class="saved-item-text">
        <span class="saved-item-carrier">${CARRIER_LABELS[item.carrier]}</span>
        ${item.memo ? ` ${item.memo}` : ""} - ${item.trackingNumber}
      </div>
      <button class="saved-item-delete" data-index="${i}">✕</button>
    </div>
  `,
    )
    .join("");

  // クリックで追跡
  savedList.querySelectorAll(".saved-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.classList.contains("saved-item-delete")) return;
      const idx = parseInt(el.dataset.index);
      const item = savedItems[idx];
      const url = buildUrl(item.carrier, item.trackingNumber.replace(/-/g, ""));
      window.open(url, "_blank");
    });
  });

  // 削除
  savedList.querySelectorAll(".saved-item-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      savedItems.splice(idx, 1);
      saveToStorage();
      renderSaved();
    });
  });
}

function saveCurrentItem(carrier, memo, trackingNumber) {
  // 同じ追跡番号・業者の重複チェック
  const exists = savedItems.some(
    (i) => i.carrier === carrier && i.trackingNumber === trackingNumber,
  );
  if (exists) return;

  if (savedItems.length >= MAX_SAVED) {
    // 最古を削除
    savedItems.shift();
  }
  savedItems.push({ carrier, memo, trackingNumber });
  saveToStorage();
  renderSaved();
}

// 配送業者の選択
toggleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    toggleBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCarrier = btn.dataset.carrier;
    errorMessage.classList.remove("show");
  });
});

// 確認方法の選択
actionBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    actionBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedAction = btn.dataset.action;
    urlOutput.classList.remove("show");
  });
});

// URLコピー機能
copyBtn.addEventListener("click", async () => {
  const url = urlDisplay.textContent;
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

// 配送状況確認ボタン
checkBtn.addEventListener("click", () => {
  const trackingNumber = trackingInput.value.trim();

  if (!trackingNumber) {
    errorMessage.classList.add("show");
    trackingInput.focus();
    return;
  }

  errorMessage.classList.remove("show");

  const cleanedNumber = trackingNumber.replace(/-/g, "");
  const memo = memoInput.value.trim();
  const url = buildUrl(selectedCarrier, cleanedNumber);

  // 保存
  saveCurrentItem(selectedCarrier, memo, trackingNumber);

  if (selectedAction === "navigate") {
    window.open(url, "_blank");
    urlOutput.classList.remove("show");
  } else if (selectedAction === "show-url") {
    urlDisplay.textContent = url;
    urlOutput.classList.add("show");
  }
});

// Enterキーで確認
trackingInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    checkBtn.click();
  }
});

// 入力時にエラーメッセージを消す & 数値とハイフン以外を除去
trackingInput.addEventListener("input", (e) => {
  errorMessage.classList.remove("show");
  e.target.value = e.target.value.replace(/[^0-9-]/g, "");
});

// 初期描画
renderSaved();
