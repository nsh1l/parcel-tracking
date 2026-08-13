import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker from "./tracking-worker.js";

const fixture = await readFile(new URL("./fixtures/yamato-hit.html", import.meta.url), "utf8");
const originalFetch = globalThis.fetch;
let requestedUrl = "";
let requestedOptions = {};
globalThis.fetch = async (url, options) => {
  requestedUrl = String(url);
  requestedOptions = options;
  return new Response(fixture, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=UTF-8" },
  });
};

try {
  const response = await worker.fetch(
    new Request(
      "https://test.local/?carrier=yamato&number=1234-5678-9012",
    ),
  );
  assert.equal(response.status, 200);
  const result = await response.json();

  assert.equal(requestedUrl, "https://toi.kuronekoyamato.co.jp/cgi-bin/tneko");
  assert.equal(requestedOptions.method, "POST");
  assert.equal(requestedOptions.headers["Content-Type"], "application/x-www-form-urlencoded");
  assert.equal(
    await new Response(requestedOptions.body).text(),
    "number00=1&number01=123456789012&category=0",
  );
  assert.equal(result.carrier, "yamato");
  assert.equal(result.status, "hit");
  assert.equal(result.info.number, "123456789012");
  assert.equal(result.info.status, "配達完了");
  assert.equal(result.info.type, "宅急便");
  assert.equal(result.info.scheduledDate, "08/13");
  assert.equal(result.history.length, 2);
  assert.deepEqual(result.history[0], {
    status: "荷物受付",
    date: "08月12日",
    time: "09:10",
    office: "岡山中央センター",
  });
  assert.deepEqual(result.latest, {
    status: "配達完了",
    date: "08月13日",
    time: "11:31",
    office: "岡山中央センター",
  });

  console.log("yamato parser test: ok");
} finally {
  globalThis.fetch = originalFetch;
}
