import { CARRIERS } from "../carrier.js";

const MIN_NUMBER_LENGTH = 10;
const MAX_NUMBER_LENGTH = 40;
const MAX_RESPONSE_BYTES = 512 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
const YAMATO_LOOKUP_URL = "https://toi.kuronekoyamato.co.jp/cgi-bin/tneko";

// These pages return server-rendered tracking data that can be classified by a Worker.
// Other carriers are still queried by lookupAll(), but their SPA/session-only pages are
// returned as unavailable instead of being presented as false positives.
const PARSERS = {
  japanpost: parseJapanPost,
  sagawa: parseSagawa,
  yamato: parseYamato,
  okaken: parseOkaken,
  ocs: parseOcs,
};

const UNAVAILABLE_REASONS = {
  seino: "文字コード・画面仕様のため自動判定に未対応です",
  fukutsu: "追跡フォームがURL照会に対応していません",
  dhl: "追跡ページがブラウザセッションを必要とします",
  fedex: "追跡ページが自動照会に対応していません",
  ydh: "外部集約サイトのため自動判定に未対応です",
  sfexpress: "追跡ページがSPAのため自動判定に未対応です",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return corsResponse();
    if (request.method !== "GET") {
      return json({ error: "GET only" }, 405);
    }

    const url = new URL(request.url);
    const number = normalizeTrackingNumber(url.searchParams.get("number"));
    const carrier = url.searchParams.get("carrier")?.trim().toLowerCase();

    if (!number) {
      return json(
        {
          error:
            "Missing or invalid number. Use 10-40 alphanumeric characters; hyphens are allowed.",
        },
        400,
      );
    }

    if (carrier) {
      if (!CARRIERS[carrier]) {
        return json({ error: `Unknown carrier: ${carrier}` }, 400);
      }
      return json(await lookupCarrier(carrier, number));
    }

    return json(await lookupAll(number));
  },
};

function normalizeTrackingNumber(value) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/-/g, "").trim().toUpperCase();
  if (
    normalized.length < MIN_NUMBER_LENGTH ||
    normalized.length > MAX_NUMBER_LENGTH ||
    !/^[A-Z0-9]+$/.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

async function lookupAll(number) {
  const carriers = Object.keys(CARRIERS);
  const settled = await Promise.allSettled(
    carriers.map((carrier) => lookupCarrier(carrier, number)),
  );
  const hits = [];
  const unavailable = [];
  const errors = [];

  settled.forEach((entry, index) => {
    const carrier = carriers[index];
    if (entry.status === "rejected") {
      errors.push({ carrier, message: toErrorMessage(entry.reason) });
      return;
    }

    const result = entry.value;
    if (result.status === "hit") {
      hits.push(result);
    } else if (result.status === "not_implemented") {
      unavailable.push({
        carrier,
        message: result.message || UNAVAILABLE_REASONS[carrier] || "未対応です",
      });
    } else if (result.status === "error") {
      errors.push({ carrier, message: result.message || "照会に失敗しました" });
    }
  });

  return { number, hits, checked: carriers, unavailable, errors };
}

async function lookupCarrier(carrier, number) {
  const trackingUrl = CARRIERS[carrier]?.buildUrl(number);
  if (!trackingUrl) {
    return { carrier, status: "error", message: "追跡URLを構築できません" };
  }

  try {
    const response =
      carrier === "yamato"
        ? await fetchYamato(number)
        : await fetchWithTimeout(trackingUrl);
    if (!response.ok) {
      return { carrier, status: "error", message: `HTTP ${response.status}` };
    }

    const html = await readResponseText(response);
    const parser = PARSERS[carrier];
    if (!parser) {
      return {
        carrier,
        status: "not_implemented",
        message: UNAVAILABLE_REASONS[carrier] || "自動判定に未対応です",
      };
    }

    return { carrier, ...parser(html, number) };
  } catch (error) {
    return { carrier, status: "error", message: toErrorMessage(error) };
  }
}

async function fetchYamato(number) {
  const body = new URLSearchParams({
    number00: "1",
    number01: number,
    category: "0",
  });
  return fetchWithTimeout(YAMATO_LOOKUP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        ...options.headers,
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "parcel-tracking/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseText(response) {
  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("carrier response too large");
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

function parseJapanPost(html) {
  if (containsAny(html, ["お問い合わせ番号が見つかりません", "お問い合せ番号が見つかりません"])) {
    return { status: "not_found", message: "お問い合わせ番号が見つかりません" };
  }

  const info = {};
  const tableMatch = html.match(
    /<table class="tableType01[^>]*>[\s\S]*?<\/table>/i,
  );
  if (tableMatch) {
    const row = tableMatch[0].match(
      /<tr>[\s\S]*?<td[^>]*>[\s\S]*?<\/td>[\s\S]*?<\/tr>/i,
    );
    if (row) {
      const cells = row[0].match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      if (cells) {
        const values = cells.map(tableCellText);
        if (values.length >= 4) {
          info.number = values[0];
          info.type = values[1];
          info.date = values[2];
          info.status = values[3];
          if (values[4]) info.office = values[4];
          if (values[5]) info.prefecture = values[5];
        }
      }
    }
  }

  const history = [];
  const eventMatch = html.match(
    /<table class="tableType02[^>]*>[\s\S]*?<\/table>/i,
  );
  if (eventMatch) {
    const rows = eventMatch[0].match(/<tr>[\s\S]*?<\/tr>/gi) || [];
    for (const row of rows.slice(1)) {
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      if (!cells) continue;
      const values = cells.map(tableCellText);
      if (values.length >= 3) {
        history.push({
          date: values[0] || "",
          time: values[1] || "",
          status: values[2] || "",
          office: values[3] || "",
          prefecture: values[4] || "",
        });
      }
    }
  }

  if (!info.status && history.length === 0) {
    return { status: "not_found", message: "追跡情報が見つかりません" };
  }

  return {
    status: "hit",
    info,
    history,
    latest: info.status ? { ...info } : history.at(-1) || null,
  };
}

function parseSagawa(html) {
  if (html.includes("該当なし")) {
    return { status: "not_found", message: "該当するデータが見つかりません" };
  }

  const info = {};
  const statusMatch = html.match(/<span class="state">([^<]+)<\/span>/i);
  if (statusMatch) info.status = htmldecode(statusMatch[1]);
  if (info.status?.includes("該当なし")) {
    return { status: "not_found", message: "該当するデータが見つかりません" };
  }

  const detailMatch = html.match(
    /<table[^>]*class="[^"]*table_okurijo_detail2[^"]*"[^>]*>[\s\S]*?<\/table>/i,
  );
  if (detailMatch) {
    const rows = detailMatch[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    for (const row of rows) {
      const th = row.match(/<th[^>]*>([\s\S]*?)<\/th>/i);
      const td = row.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
      if (!th || !td) continue;
      const label = htmldecode(th[1]).replace(/[　\s]+/g, "").trim();
      const value = htmldecode(td[1]);
      if (label.includes("送り状No")) info.number = value;
      else if (label.includes("出荷日")) info.shipDate = value;
      else if (label.includes("個数")) info.itemCount = value;
    }
  }

  const history = parseSagawaHistory(html);
  if (!info.status && !info.number && history.length === 0) {
    return { status: "not_found", message: "追跡情報が見つかりません" };
  }

  return {
    status: "hit",
    info,
    history,
    latest: info.status
      ? { status: info.status, date: info.shipDate }
      : history.at(-1) || null,
  };
}

function parseSagawaHistory(html) {
  const tables = [
    ...html.matchAll(
      /<table[^>]*class="[^"]*table_okurijo[^"]*"[^>]*>[\s\S]*?<\/table>/gi,
    ),
  ];
  const table = tables.at(-1)?.[0];
  if (!table) return [];

  const history = [];
  const rows = table.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  for (const row of rows.slice(1)) {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    if (!cells) continue;
    const values = cells.map(tableCellText);
    if (values.length >= 2) {
      history.push({
        date: values[0] || "",
        time: values[1] || "",
        status: values[2] || "",
        office: values[3] || "",
      });
    }
  }
  return history;
}

function parseYamato(html, number) {
  const title = firstClassText(html, "tracking-invoice-block-title");
  const state = firstClassText(html, "tracking-invoice-block-state-title");
  if (!title || !state) {
    return { status: "not_found", message: "追跡情報が見つかりません" };
  }

  const resultNumber = number;
  const normalizedTitle = title.replace(/\D/g, "");
  if (!normalizedTitle.endsWith(resultNumber)) {
    return { status: "not_found", message: "追跡情報が見つかりません" };
  }
  if (containsAny(state, ["伝票番号未登録", "伝票番号誤り"])) {
    return { status: "not_found", message: state };
  }

  const info = { number: resultNumber, status: state };
  const summaryMatch = html.match(
    /<div\b[^>]*class=["'][^"']*\btracking-invoice-block-summary\b[^"']*["'][^>]*>[\s\S]*?<ul\b[^>]*>([\s\S]*?)<\/ul>/i,
  );
  const summaryItems = summaryMatch?.[1]?.match(/<li\b[\s\S]*?<\/li>/gi) || [];
  for (const item of summaryItems) {
    const label = firstClassText(item, "item").replace(/[：:]$/, "");
    const value = firstClassText(item, "data");
    if (label && value) {
      if (label.includes("商品名")) info.type = value;
      if (label.includes("お届け予定日時")) info.scheduledDate = value;
    }
  }

  const history = [];
  const detailMatch = html.match(
    /<div\b[^>]*class=["'][^"']*\btracking-invoice-block-detail\b[^"']*["'][^>]*>[\s\S]*?<ol\b[^>]*>([\s\S]*?)<\/ol>/i,
  );
  const rows = detailMatch?.[1]?.match(/<li\b[\s\S]*?<\/li>/gi) || [];
  for (const row of rows) {
    const event = {
      status: firstClassText(row, "item"),
      date: "",
      time: "",
      office: firstClassText(row, "name"),
    };
    const dateTime = firstClassText(row, "date");
    const timeMatch = dateTime.match(/(\d{1,2}:\d{2})\s*$/);
    event.time = timeMatch?.[1] || "";
    event.date = timeMatch ? dateTime.slice(0, timeMatch.index).trim() : dateTime;
    if (event.status) history.push(event);
  }

  const latest = history.at(-1) || { status: state };
  return { status: "hit", info, history, latest };
}

function parseOkaken(html, number) {
  if (
    containsAny(html, [
      "お問合せ番号に該当するものがありません",
      "お問い合せ番号に該当するものがありません",
    ])
  ) {
    return { status: "not_found", message: "該当するデータが見つかりません" };
  }

  const text = stripTags(html);
  if (!html.includes(number) || !/(貨物追跡|追跡照会|お荷物)/.test(text)) {
    return { status: "not_found", message: "追跡情報が見つかりません" };
  }

  return {
    status: "hit",
    info: { number },
    history: [],
    latest: { status: "追跡情報あり" },
  };
}

function parseOcs(html, number) {
  if (html.includes("条件に一致する情報がありません")) {
    return { status: "not_found", message: "該当するデータが見つかりません" };
  }

  const chartMatch = html.match(/<tbody[^>]*id="chart"[^>]*>([\s\S]*?)<\/tbody>/i);
  const chart = chartMatch?.[1] || "";
  const rows = chart.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  const dataRows = rows.filter((row) => /<td\b/i.test(row));
  if (!chart.includes(number) || dataRows.length === 0) {
    return { status: "not_found", message: "追跡情報が見つかりません" };
  }

  const values = dataRows[0].match(/<td[^>]*>([\s\S]*?)<\/td>/gi)?.map(tableCellText) || [];
  return {
    status: "hit",
    info: {
      number: values[0] || number,
      status: values[1] || "",
      sender: values[2] || "",
      recipient: values[3] || "",
      itemCount: values[4] || "",
      weight: values[5] || "",
      volumeWeight: values[6] || "",
    },
    history: [],
    latest: { status: values[1] || "追跡情報あり" },
  };
}

function tableCellText(cell) {
  return htmldecode(stripTags(cell).replace(/\s+/g, " "));
}

function stripTags(text) {
  return htmldecode(text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function htmldecode(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

function containsAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function firstClassText(html, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(
    new RegExp(
      `<([a-z0-9]+)\\b[^>]*class=["'][^"']*\\b${escaped}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
      "i",
    ),
  );
  return match ? stripTags(match[2]) : "";
}

function toErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  };
}

function corsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
