import { useEffect, useRef, useState } from "react";
import {
  Box,
  Center,
  Cluster,
  Flex,
  Grid,
  Heading,
  Stack,
  Text,
} from "lism-css/react";
import { CARRIERS } from "../carrier.js";
import { detectCarrier } from "../detector.js";
import { fetchAllStatuses } from "../scraper.js";
import { addSavedItem, getSavedItems, removeSavedItem } from "../storage.js";
import { buildUrl, carrierLabel, format } from "../url-builder.js";
import { validateTrackingNumber } from "../validator.js";

const MAX_SAVED = 8;
const CARRIER_KEYS = Object.keys(CARRIERS);

export function App() {
  const [selectedCarrier, setSelectedCarrier] = useState("sagawa");
  const [selectedAction, setSelectedAction] = useState("check-status");
  const [selectedDirection, setSelectedDirection] = useState("shipping");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [memo, setMemo] = useState("");
  const [dateSlot, setDateSlot] = useState("");
  const [size, setSize] = useState("");
  const [itemCount, setItemCount] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [detectBadge, setDetectBadge] = useState("");
  const [savedItems, setSavedItems] = useState(() => getSavedItems());
  const [urlData, setUrlData] = useState(null);
  const [statusView, setStatusView] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copyState, setCopyState] = useState("");
  const [copyError, setCopyError] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!trackingNumber.trim()) {
      setDetectBadge("");
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const detected = detectCarrier(trackingNumber);
      if (!detected || !CARRIERS[detected]) return;
      setSelectedCarrier(detected);
      setDetectBadge(`${CARRIERS[detected].icon} ${CARRIERS[detected].label}を検出`);
      window.setTimeout(() => setDetectBadge(""), 3000);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [trackingNumber]);

  function clearOutputs() {
    requestIdRef.current += 1;
    setUrlData(null);
    setStatusView(null);
    setBusy(false);
    setCopyState("");
    setCopyError("");
  }

  function handleTrackingChange(event) {
    const nextValue = event.target.value.replace(/[^0-9A-Za-z-]/g, "");
    setTrackingNumber(nextValue);
    setErrorMessage("");
  }

  function handleSizeChange(event) {
    setSize(event.target.value.replace(/[^0-9]/g, ""));
  }

  function handleItemCountChange(event) {
    setItemCount(event.target.value.replace(/[^0-9]/g, ""));
  }

  function handleActionChange(action) {
    setSelectedAction(action);
    clearOutputs();
  }

  function syncSavedItems() {
    setSavedItems(getSavedItems());
  }

  async function handleCopy(kind) {
    if (!urlData) return;

    const text =
      kind === "url"
        ? buildUrl(urlData.carrier, urlData.number)
        : format({
            carrier: urlData.carrier,
            number: urlData.number,
            dateSlot: urlData.dateSlot,
            size: urlData.size,
            itemCount: urlData.itemCount,
          });

    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopyState(kind);
      setCopyError("");
      window.setTimeout(() => setCopyState(""), 2000);
    } catch {
      setCopyError("コピーに失敗しました。ブラウザの権限をご確認ください。");
    }
  }

  async function handleCheck() {
    const displayNumber = trackingNumber.trim();
    if (!displayNumber) {
      setErrorMessage("配送番号を入力してください");
      document.getElementById("trackingNumber")?.focus();
      return;
    }

    setErrorMessage("");
    const cleanedNumber = displayNumber.replace(/-/g, "").toUpperCase();

    if (selectedAction === "check-status") {
      const requestId = ++requestIdRef.current;
      setUrlData(null);
      setStatusView({ type: "loading", displayNumber });
      setBusy(true);

      try {
        const result = await fetchAllStatuses(cleanedNumber);
        if (requestId !== requestIdRef.current) return;

        const hits = getKnownHits(result);
        if (hits.length > 0) {
          hits.forEach((hit) => {
            addSavedItem(
              hit.carrier,
              memo.trim(),
              displayNumber,
              MAX_SAVED,
              selectedDirection,
            );
          });
          syncSavedItems();
        }
        setStatusView({ type: "result", displayNumber, result });
      } finally {
        if (requestId === requestIdRef.current) setBusy(false);
      }
      return;
    }

    const validation = validateTrackingNumber(selectedCarrier, cleanedNumber);
    if (!validation.isValid) {
      setErrorMessage(validation.message);
      document.getElementById("trackingNumber")?.focus();
      return;
    }

    addSavedItem(
      selectedCarrier,
      memo.trim(),
      displayNumber,
      MAX_SAVED,
      selectedDirection,
    );
    syncSavedItems();
    setUrlData({
      carrier: selectedCarrier,
      number: displayNumber,
      dateSlot: dateSlot.trim(),
      size: size.trim(),
      itemCount: itemCount.trim(),
    });
    setStatusView(null);
  }

  function openSavedItem(item) {
    const url = buildUrl(item.carrier, item.trackingNumber.replace(/-/g, ""));
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  function deleteSavedItem(index) {
    removeSavedItem(index);
    syncSavedItems();
  }

  return (
    <Center as="main" className="page-center">
      <Box as="section" className="panel">
        <Stack g="20">
          <Stack className="header" g="5" ai="center">
            <Heading level="1" fz="l" fw="700" c="text">
              📦 配送状況確認
            </Heading>
            <Text as="div" className="sub" fz="xs" c="text-2">
              配送番号を入力して追跡
            </Text>
          </Stack>

          <Stack className="tracking-hero" g="5">
            <span className="icon" aria-hidden="true">
              📋
            </span>
            <input
              id="trackingNumber"
              className="-w:100%"
              type="text"
              value={trackingNumber}
              onChange={handleTrackingChange}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleCheck();
              }}
              placeholder="配送番号を入力"
              autoComplete="off"
              aria-label="配送番号"
              aria-describedby="tracking-help tracking-error"
              aria-invalid={Boolean(errorMessage)}
            />
            <div id="tracking-help" className={`detect-badge${detectBadge ? " show" : ""}`}>
              {detectBadge}
            </div>
            <div id="tracking-error" className={`error-message${errorMessage ? " show" : ""}`} role="alert">
              {errorMessage || "配送番号を入力してください"}
            </div>
          </Stack>

          <Stack g="5">
            <Text as="div" className="section-label" fz="xs" fw="700">
              配送業者
            </Text>
            <Cluster className="chip-row" g="10">
              {CARRIER_KEYS.map((carrier) => {
                const config = CARRIERS[carrier];
                const active = selectedCarrier === carrier;
                return (
                  <button
                    key={carrier}
                    className={`chip${active ? " active" : ""} -d:inline-flex -ai:center -g:5 -px:15 -py:10 -bdrs:99 -bd -fz:s -fw:600`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setSelectedCarrier(carrier);
                      setErrorMessage("");
                      setDetectBadge("");
                    }}
                  >
                    <span className="chip-icon" aria-hidden="true">
                      {config.icon}
                    </span>
                    {config.label}
                  </button>
                );
              })}
            </Cluster>
          </Stack>

          <input
            id="memo"
            className="memo-input -w:100% -px:15 -py:10 -bdrs:10 -bd -fz:s"
            type="text"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="メモ（品番・発送先など）"
            autoComplete="off"
            aria-label="メモ"
          />

          <button
            id="detailsToggle"
            className={`details-toggle${detailsOpen ? " open" : ""} -d:inline-flex -ai:center -g:5 -bd:none -bgc:transparent -p:0 -c:text-2 -fz:xs -fw:700`}
            type="button"
            aria-expanded={detailsOpen}
            aria-controls="detailsBody"
            onClick={() => setDetailsOpen((open) => !open)}
          >
            <span className="arrow" aria-hidden="true">
              ▶
            </span>
            詳細（指定日・サイズ・個口）
          </button>
          <Grid
            className={`details-body${detailsOpen ? " open" : ""}`}
            id="detailsBody"
            g="10"
            hidden={!detailsOpen}
          >
            <input
              id="dateSlot"
              className="-w:100% -px:15 -py:10 -bdrs:10 -bd -fz:s"
              type="text"
              value={dateSlot}
              onChange={(event) => setDateSlot(event.target.value)}
              placeholder="6/25 午前"
              aria-label="指定日・時間帯"
              autoComplete="off"
            />
            <input
              id="size"
              className="-w:100% -px:15 -py:10 -bdrs:10 -bd -fz:s"
              type="text"
              value={size}
              onChange={handleSizeChange}
              placeholder="80"
              aria-label="サイズ"
              inputMode="numeric"
              autoComplete="off"
            />
            <input
              id="itemCount"
              className="-w:100% -px:15 -py:10 -bdrs:10 -bd -fz:s"
              type="text"
              value={itemCount}
              onChange={handleItemCountChange}
              placeholder="2"
              aria-label="個口数"
              inputMode="numeric"
              autoComplete="off"
            />
          </Grid>

          <Grid className="inline-row" g="15">
            <Stack className="inline-group" g="5">
              <Text as="div" className="section-label" fz="xs" fw="700">
                荷物区分
              </Text>
              <Flex className="seg-btns" g="5">
                <button
                  className={`seg-btn${selectedDirection === "shipping" ? " active" : ""} -fx:1 -py:10 -px:10 -bdrs:10 -bd -fz:s -fw:600`}
                  type="button"
                  aria-pressed={selectedDirection === "shipping"}
                  data-direction="shipping"
                  onClick={() => setSelectedDirection("shipping")}
                >
                  📤 発送
                </button>
                <button
                  className={`seg-btn${selectedDirection === "receiving" ? " active" : ""} -fx:1 -py:10 -px:10 -bdrs:10 -bd -fz:s -fw:600`}
                  type="button"
                  aria-pressed={selectedDirection === "receiving"}
                  data-direction="receiving"
                  onClick={() => setSelectedDirection("receiving")}
                >
                  📥 受取
                </button>
              </Flex>
            </Stack>
            <Stack className="inline-group" g="5">
              <Text as="div" className="section-label" fz="xs" fw="700">
                確認方法
              </Text>
              <Flex className="seg-btns" g="5">
                <button
                  className={`seg-btn${selectedAction === "check-status" ? " active" : ""} -fx:1 -py:10 -px:10 -bdrs:10 -bd -fz:s -fw:600`}
                  type="button"
                  aria-pressed={selectedAction === "check-status"}
                  aria-label="ステータス確認"
                  data-action="check-status"
                  onClick={() => handleActionChange("check-status")}
                >
                  📡
                </button>
                <button
                  className={`seg-btn${selectedAction === "show-url" ? " active" : ""} -fx:1 -py:10 -px:10 -bdrs:10 -bd -fz:s -fw:600`}
                  type="button"
                  aria-pressed={selectedAction === "show-url"}
                  data-action="show-url"
                  onClick={() => handleActionChange("show-url")}
                >
                  URL
                </button>
              </Flex>
            </Stack>
          </Grid>

          <button
            className="cta -w:100% -d:flex -ai:center -jc:center -g:5 -py:15 -px:20 -bdrs:10 -bgc:brand -c:base -fz:m -fw:700"
            type="button"
            disabled={busy}
            onClick={() => void handleCheck()}
          >
            {busy ? "確認中…" : "配送状況を確認 →"}
          </button>

          {urlData ? (
            <UrlOutput
              data={urlData}
              copyState={copyState}
              copyError={copyError}
              onCopy={handleCopy}
            />
          ) : null}
          {statusView ? <StatusOutput view={statusView} /> : null}

          <Stack className="saved" g="10">
            <Flex className="saved-header" jc="between" ai="center">
              <Text as="span" className="saved-title" fz="xs" fw="700">
                📋 保存済み
              </Text>
              <Text as="span" className="saved-count" fz="xs" fw="600">
                {savedItems.length} / {MAX_SAVED}
              </Text>
            </Flex>
            <Stack as="ul" className="saved-list" g="5">
              {savedItems.length === 0 ? (
                <Text as="li" className="saved-empty" fz="s" c="text-2">
                  保存された追跡番号はありません
                </Text>
              ) : (
                savedItems.map((item, index) => (
                  <li
                    key={`${item.carrier}-${item.trackingNumber}-${index}`}
                    className={`saved-item ${item.direction === "receiving" ? "receiving" : "shipping"}`}
                  >
                    <button
                      className="saved-item-open"
                      type="button"
                      onClick={() => openSavedItem(item)}
                    >
                      <span className="saved-item-dir" aria-hidden="true">
                        {item.direction === "receiving" ? "📥" : "📤"}
                      </span>
                      <span className="saved-item-text">
                        <span className="saved-item-carrier">
                          {carrierLabel(item.carrier)}
                        </span>
                        {item.memo ? ` ${item.memo}` : ""} - {item.trackingNumber}
                      </span>
                    </button>
                    <button
                      className="saved-item-del"
                      type="button"
                      aria-label={`${carrierLabel(item.carrier)} ${item.trackingNumber}を削除`}
                      onClick={() => deleteSavedItem(index)}
                    >
                      ✕
                    </button>
                  </li>
                ))
              )}
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Center>
  );
}

function UrlOutput({ data, copyState, copyError, onCopy }) {
  const url = buildUrl(data.carrier, data.number);
  const formatted = format({
    carrier: data.carrier,
    number: data.number,
    dateSlot: data.dateSlot,
    size: data.size,
    itemCount: data.itemCount,
  });
  const heading = formatted.split("\n")[0];

  return (
    <Stack as="section" className="url-output show" g="10" aria-live="polite">
      <Text as="div" className="url-label" fz="s" fw="600">
        共有用にコピーする
      </Text>
      <Box className="url-display -p:15 -bdrs:10 -bd -fz:s">
        <span className="url-line">{heading}</span>
        {url ? (
          <a
            className="url-link"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {url}
          </a>
        ) : null}
      </Box>
      <Flex className="copy-buttons" g="10" fxw="wrap">
        <button
          className={`copy-btn${copyState === "url" ? " copied" : ""} -fx:1 -py:10 -px:15 -bdrs:10 -fz:s -fw:600`}
          type="button"
          onClick={() => void onCopy("url")}
        >
          {copyState === "url" ? "コピーしました！" : "URLをコピー"}
        </button>
        <button
          className={`copy-btn copy-text-btn${copyState === "text" ? " copied" : ""} -fx:1 -py:10 -px:15 -bdrs:10 -fz:s -fw:600`}
          type="button"
          onClick={() => void onCopy("text")}
        >
          {copyState === "text" ? "コピーしました！" : "テキスト全体をコピー"}
        </button>
      </Flex>
      {copyError ? (
        <Text className="error-message show" role="alert" fz="xs">
          {copyError}
        </Text>
      ) : null}
    </Stack>
  );
}

function StatusOutput({ view }) {
  if (view.type === "loading") {
    return (
      <Stack as="section" className="url-output show" g="10" aria-live="polite">
        <Text as="div" className="url-label" fz="s" fw="600">
          📡 全業者を確認中…
        </Text>
        <Text className="url-display status-message status-message-muted -p:15 -bdrs:10 -bd -fz:s">
          {view.displayNumber} を照会しています…
        </Text>
      </Stack>
    );
  }

  const result = view.result || {};
  if (result.notReady) {
    return (
      <Stack as="section" className="url-output show" g="10" aria-live="polite">
        <Text as="div" className="url-label" fz="s" fw="600">
          📡 ステータス確認
        </Text>
        <Text className="url-display status-message status-message-muted -p:15 -bdrs:10 -bd -fz:s">
          ステータス確認機能は準備中です。
          <br />
          「URL」に切り替えると共有用URLを確認できます。
        </Text>
      </Stack>
    );
  }

  if (result.error) {
    return (
      <Stack as="section" className="url-output show" g="10" aria-live="polite">
        <Text as="div" className="url-label" fz="s" fw="600">
          📡 ステータス確認
        </Text>
        <Text className="url-display status-message status-message-error -p:15 -bdrs:10 -bd -fz:s">
          エラー: {String(result.error)}
        </Text>
      </Stack>
    );
  }

  const hits = getKnownHits(result);
  if (hits.length === 0) {
    const checkedCount = Array.isArray(result.checked)
      ? result.checked.length
      : CARRIER_KEYS.length;
    const errorCount = Array.isArray(result.errors) ? result.errors.length : 0;
    return (
      <Stack as="section" className="url-output show" g="10" aria-live="polite">
        <Text as="div" className="url-label" fz="s" fw="600">
          📡 ヒットした配送業者
        </Text>
        <Text className="url-display status-message status-message-muted -p:15 -bdrs:10 -bd -fz:s">
          {checkedCount}社を確認しましたが、追跡情報は見つかりませんでした。
          <br />
          {errorCount
            ? `${errorCount}社は照会エラーまたは未対応です。`
            : "番号と配送業者の組み合わせをご確認ください。"}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack as="section" className="url-output show" g="10" aria-live="polite">
      <Text as="div" className="url-label" fz="s" fw="600">
        📡 ヒットした配送業者（{hits.length}社）
      </Text>
      {hits.map((hit, index) => (
        <StatusCard key={`${hit.carrier}-${index}`} result={hit} displayNumber={view.displayNumber} />
      ))}
    </Stack>
  );
}

function StatusCard({ result, displayNumber }) {
  const carrier = result.carrier;
  const info = result.info && typeof result.info === "object" ? result.info : {};
  const latest = result.latest && typeof result.latest === "object" ? result.latest : {};
  const history = Array.isArray(result.history) ? result.history : [];
  const status = latest.status || info.status || "追跡情報あり";
  const url = buildUrl(carrier, displayNumber);
  const infoEntries = Object.entries(info).filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );

  return (
    <Box as="article" className="status-card" data-carrier={carrier}>
      <Text as="div" className="status-card-title">
        {getStatusIcon(carrier)} {carrierLabel(carrier)}
      </Text>
      <Text as="div" className="status-card-latest">
        ● {String(status)}
      </Text>
      <Flex className="status-card-info" fxw="wrap" g="5">
        {infoEntries.length > 0 ? (
          infoEntries.map(([key, value]) => (
            <Text as="span" key={key}>
              <b>{key}</b>: {String(value)}
            </Text>
          ))
        ) : (
          <Text as="span">🔢 {displayNumber}</Text>
        )}
      </Flex>
      {history.length > 0 ? (
        <details className="status-history">
          <summary className="status-history-summary">📋 履歴（{history.length}件）</summary>
          {history.map((event, index) => (
            <Flex className="status-event" key={`${event.date || ""}-${event.time || ""}-${index}`} g="15">
              <Text as="span" className="status-event-date">
                {`${event.date || ""} ${event.time || ""}`.trim()}
              </Text>
              <Text as="span" className="status-event-status">
                {event.status || ""}
              </Text>
              <Text as="span">{event.office || ""}</Text>
            </Flex>
          ))}
        </details>
      ) : null}
      {url ? (
        <a className="status-card-link" href={url} target="_blank" rel="noopener noreferrer">
          {carrierLabel(carrier)}のサイトで開く →
        </a>
      ) : null}
    </Box>
  );
}

function getKnownHits(result) {
  if (!result || !Array.isArray(result.hits)) return [];
  return result.hits.filter(
    (hit) => hit && typeof hit.carrier === "string" && CARRIERS[hit.carrier],
  );
}

function getStatusIcon(carrier) {
  return CARRIERS[carrier]?.icon || "📦";
}
