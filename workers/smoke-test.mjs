import assert from "node:assert/strict";
import worker from "./tracking-worker.js";

const originalFetch = globalThis.fetch;
const requests = [];
const OKAKEN_FIXTURE = `
<table><tr><td>お問合せ番号</td><td>４０４４０２８２９５</td></tr></table>
<table><tr><td>個口</td><td>１ 個口</td><td>重量</td><td>１５ KG</td><td>元着区分</td><td>元払い</td><td>商品名</td><td>一般貨物</td></tr></table>
<table>
  <tr><td>配達状況</td></tr>
  <tr><td>日付</td><td>時刻</td><td>状況</td><td>拠点名</td><td>お問合せ電話番号</td></tr>
  <tr><td>７ 月 ３１ 日</td><td>午後 ６時２０分</td><td>受付</td><td>岡 山</td><td>TEL 086-277-4112</td></tr>
  <tr><td>８ 月 ３ 日</td><td>午後</td><td>配達完了</td><td>エービーエクスプレス</td><td></td></tr>
  <tr><th colspan="6">中継先にて配達済み</th></tr>
</table>`;
globalThis.fetch = async (url) => {
  const requestUrl = String(url);
  requests.push(requestUrl);
  return new Response(
    requestUrl.includes("GEN=4044028295") ? OKAKEN_FIXTURE : "<html></html>",
    { status: 200 },
  );
};

try {
  const response = await worker.fetch(
    new Request("https://test.local/?number=1234-5678-9012"),
  );
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.number, "123456789012");
  assert.equal(result.checked.length, 11);
  assert.equal(requests.length, 11);
  assert.equal(result.hits.length, 0);

  requests.length = 0;
  const okakenResponse = await worker.fetch(
    new Request("https://test.local/?carrier=okaken&number=4044028295"),
  );
  assert.equal(okakenResponse.status, 200);
  const okakenResult = await okakenResponse.json();
  assert.match(requests[0], /GEN=4044028295/);
  assert.equal(okakenResult.carrier, "okaken");
  assert.equal(okakenResult.status, "hit");
  assert.equal(okakenResult.info.number, "4044028295");
  assert.equal(okakenResult.info.itemCount, "1 個口");
  assert.equal(okakenResult.history.length, 2);
  assert.equal(okakenResult.latest.status, "配達完了");

  requests.length = 0;
  const invalid = await worker.fetch(
    new Request("https://test.local/?number=123456789"),
  );
  assert.equal(invalid.status, 400);
  assert.equal(requests.length, 0);

  const options = await worker.fetch(
    new Request("https://test.local/", { method: "OPTIONS" }),
  );
  assert.equal(options.status, 204);

  console.log("worker smoke test: ok (all-carrier fan-out, validation, CORS)");
} finally {
  globalThis.fetch = originalFetch;
}
