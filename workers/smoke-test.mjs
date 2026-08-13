import assert from "node:assert/strict";
import worker from "./tracking-worker.js";

const originalFetch = globalThis.fetch;
const requests = [];
globalThis.fetch = async (url) => {
  requests.push(String(url));
  return new Response("<html></html>", { status: 200 });
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
