// Cloudflare Worker — tracking status scraper proxy
// Deploy: `cd tracking-worker && wrangler deploy`

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const carrier = url.searchParams.get("carrier");
    const number = url.searchParams.get("number");

    if (!carrier || !number) {
      return json({ error: "Missing carrier or number" }, 400);
    }

    const trackingUrl = buildUrl(carrier, number);
    if (!trackingUrl) {
      return json({ error: `Unknown carrier: ${carrier}` }, 400);
    }

    try {
      const res = await fetch(trackingUrl);
      const html = await res.text();
      const result = parseStatus(carrier, html);
      return json(result);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};

function buildUrl(carrier, n) {
  const encoded = encodeURIComponent(n);
  const urls = {
    japanpost: `https://trackings.post.japanpost.jp/services/srv/search?requestNo1=${encoded}&requestNo2=&requestNo3=&requestNo4=&requestNo5=&requestNo6=&requestNo7=&requestNo8=&requestNo9=&requestNo10=&search.x=100&search.y=25&startingUrlPatten=&locale=ja`,
    sagawa: `http://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${encoded}`,
  };
  return urls[carrier] || null;
}

function htmldecode(text) {
  return text
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

function tableCellText(cell) {
  return htmldecode(cell.replace(/<[^>]+>/g, "").replace(/\s+/g, " "));
}

function parseStatus(carrier, html) {
  if (carrier === "japanpost") return parseJapanPost(html);
  if (carrier === "sagawa") return parseSagawa(html);
  return { carrier, status: "not_implemented" };
}

// ─── Japan Post ───

function parseJapanPost(html) {
  if (html.includes("見つかりません")) {
    return { status: "error", message: "お問い合わせ番号が見つかりません" };
  }

  const info = {};
  const tableMatch = html.match(
    /<table class="tableType01[^>]*>[\s\S]*?<\/table>/i
  );
  if (tableMatch) {
    const row = tableMatch[0].match(
      /<tr>[\s\S]*?<td[^>]*>[\s\S]*?<\/td>[\s\S]*?<\/tr>/i
    );
    if (row) {
      const cells = row[0].match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      if (cells) {
        const tds = cells.map(tableCellText);
        if (tds.length >= 4) {
          info.number = tds[0];
          info.type = tds[1];
          info.date = tds[2];
          info.status = tds[3];
          if (tds[4]) info.office = tds[4];
          if (tds[5]) info.prefecture = tds[5];
        }
      }
    }
  }

  const history = [];
  const eventMatch = html.match(
    /<table class="tableType02[^>]*>[\s\S]*?<\/table>/i
  );
  if (eventMatch) {
    const rows = eventMatch[0].match(/<tr>[\s\S]*?<\/tr>/gi) || [];
    let isHeader = true;
    for (const row of rows) {
      if (isHeader) {
        isHeader = false;
        continue;
      }
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      if (!cells) continue;
      const tds = cells.map(tableCellText);
      if (tds.length >= 3) {
        history.push({
          date: tds[0] || "",
          time: tds[1] || "",
          status: tds[2] || "",
          office: tds[3] || "",
          prefecture: tds[4] || "",
        });
      }
    }
  }

  return { carrier: "japanpost", info, history, latest: info.status ? info : null };
}

// ─── Sagawa ───

function parseSagawa(html) {
  // Check "該当なし" — no tracking data
  if (html.includes("該当なし")) {
    return { status: "error", message: "該当するデータが見つかりません" };
  }

  const info = {};

  // ── Latest status from ttl02 summary row ──
  const statusMatch = html.match(/<span class="state">([^<]+)<\/span>/i);
  if (statusMatch) {
    info.status = htmldecode(statusMatch[1]);
  }

  // ── Detail fields from table_okurijo_detail2 ──
  const detailMatch = html.match(
    /<table[^>]*class="[^"]*table_okurijo_detail2[^"]*"[^>]*>[\s\S]*?<\/table>/i
  );
  if (detailMatch) {
    const rows =
      detailMatch[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    for (const row of rows) {
      const th = row.match(/<th[^>]*>([\s\S]*?)<\/th>/i);
      const td = row.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
      if (th && td) {
        const label = htmldecode(th[1]).replace(/[　\s]+/g, "").trim();
        const value = htmldecode(td[1]);
        if (label.includes("送り状No")) info.number = value;
        else if (label.includes("出荷日")) info.shipDate = value;
        else if (label.includes("個数")) info.itemCount = value;
      }
    }
  }

  // ── Event history from table_okurijo (last table, most detailed) ──
  const history = [];
  const historyTables = [
    ...html.matchAll(
      /<table[^>]*class="[^"]*table_okurijo[^"]*"[^>]*>[\s\S]*?<\/table>/gi
    ),
  ];
  // Use the last matching table (usually the event timeline)
  const table = historyTables[historyTables.length - 1];
  if (table) {
    const rows = table[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    let isHeader = true;
    for (const row of rows) {
      if (isHeader) {
        isHeader = false;
        continue;
      }
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      if (!cells) continue;
      const tds = cells.map(tableCellText);
      if (tds.length >= 2) {
        history.push({
          date: tds[0] || "",
          time: tds[1] || "",
          status: tds[2] || "",
          office: tds[3] || "",
        });
      }
    }
  }

  return {
    carrier: "sagawa",
    info,
    history,
    latest: info.status
      ? { status: info.status, date: info.shipDate }
      : null,
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
