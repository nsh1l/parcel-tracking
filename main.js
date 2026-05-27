import { CARRIERS } from "./carrier.js";
import { getSavedItems, saveItems, addSavedItem, removeSavedItem } from "./storage.js";
import { buildUrl, getCarrierLabel, formatUrlDisplay } from "./url-builder.js";
import { validateTrackingNumber } from "./validator.js";

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

const MAX_SAVED = 8;

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
      const item = savedItems[idx];
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
  });
});

actionBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    actionBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedAction = btn.dataset.action;
    urlOutput.classList.remove("show");
  });
});

copyBtn.addEventListener("click", async () => {
  // innerHTMLなのでタグを除いたテキストのみを取得
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

checkBtn.addEventListener("click", () => {
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
  const url = buildUrl(selectedCarrier, cleanedNumber);

  addSavedItem(selectedCarrier, memo, trackingNumber, MAX_SAVED);
  renderSaved();

  if (selectedAction === "navigate") {
    window.open(url, "_blank");
    urlOutput.classList.remove("show");
  } else if (selectedAction === "show-url") {
    urlDisplay.innerHTML = formatUrlDisplay(selectedCarrier, trackingNumber, url);
    urlOutput.classList.add("show");
  }
});

trackingInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    checkBtn.click();
  }
});

trackingInput.addEventListener("input", (e) => {
  errorMessage.classList.remove("show");
  e.target.value = e.target.value.replace(/[^0-9-]/g, "");
});

renderSaved();
