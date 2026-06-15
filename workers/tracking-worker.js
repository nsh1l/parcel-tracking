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
  };
  return urls[carrier] || null;
}

function parseStatus(carrier, html) {
  if (carrier === "japanpost") {
    // Error: number not found
    if (html.includes("見つかりません") || html.includes("エラー")) {
      return { status: "error", message: "お問い合わせ番号が見つかりません" };
    }

    // ── info table (summary row) ──
    const info = {};
    const tableMatch = html.match(
      /<table class="tableType01[^>]*>[\s\S]*?<\/table>/i
    );
    if (tableMatch) {
      // Grab the first non-header row (colspan=5 → error; otherwise detail row)
      const row = tableMatch[0].match(
        /<tr>[\s\S]*?<td[^>]*>[\s\S]*?<\/td>[\s\S]*?<\/tr>/i
      );
      if (row) {
        const cells = row[0].match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
        if (cells) {
          const tds = cells.map((c) =>
            c.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
          );
          if (tds.length >= 4) {
            info.number = tds[0];
            info.type = tds[1];
            info.date = tds[2];
            info.status = tds[3];
            if (tds[4]) info.office = tds[4];
            if (tds[5]) info.prefecture = tds[5];
          } else {
            info.raw = tds[0];
          }
        }
      }
    }

    // ── event history table ──
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
        const tds = cells.map((c) =>
          c.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
        );
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

  return { carrier, status: "not_implemented" };
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
