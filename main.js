let selectedCarrier = "sagawa";
let selectedAction = "navigate";
const actionBtns = document.querySelectorAll(".action-btn");
const urlOutput = document.getElementById("urlOutput");
const urlDisplay = document.getElementById("urlDisplay");
const copyBtn = document.getElementById("copyBtn");
const trackingInput = document.getElementById("trackingNumber");
const checkBtn = document.getElementById("checkBtn");
const errorMessage = document.getElementById("errorMessage");
const toggleBtns = document.querySelectorAll(".toggle-btn");

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

  // ハイフンを除去して数値のみにする
  const cleanedNumber = trackingNumber.replace(/-/g, "");

  // URLを生成
  let url;
  if (selectedCarrier === "sagawa") {
    url = `http://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${encodeURIComponent(cleanedNumber)}`;
  } else if (selectedCarrier === "yamato") {
    url = `https://member.kms.kuronekoyamato.co.jp/parcel/detail?pno=${encodeURIComponent(cleanedNumber)}`;
  } else if (selectedCarrier === "seino") {
    url = `https://track.seino.co.jp/cgi-bin/gnpquery.pgm?GNPNO1=${encodeURIComponent(cleanedNumber)}`;
  } else if (selectedCarrier === "dhl") {
    url = `https://mydhl.express.dhl/jp/ja/tracking.html#/results?id=${encodeURIComponent(cleanedNumber)}`;
  } else if (selectedCarrier === "ocs") {
    url = `https://webcsw.ocs.co.jp/csw/ECSWG0201R00003P.do?cwbno=${encodeURIComponent(cleanedNumber)}`;
  }

  // 選択されたアクションに応じて処理
  if (selectedAction === "navigate") {
    window.open(url, "_blank");
    // document.getElementById("urlDisplay").setHTML(`<iframe src=${url} width="100%" height="600px"></iframe>`);
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
  // 数値とハイフン以外を除去
  e.target.value = e.target.value.replace(/[^0-9-]/g, "");
});
