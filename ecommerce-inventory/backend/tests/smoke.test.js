// Runs WITHOUT a database: checks the app starts, validation, auth and error handling.
// Run with: npm test
process.env.JWT_ACCESS_SECRET = "test_access";
process.env.JWT_REFRESH_SECRET = "test_refresh";
const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const app = require("../app");

let server, base;
test.before(async () => {
  server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const call = (path, opts = {}) =>
  fetch(base + path, { headers: { "Content-Type": "application/json" }, ...opts }).then(async (r) => ({ status: r.status, body: await r.json() }));

test("health check returns 200", async () => {
  const r = await call("/api/health");
  assert.strictEqual(r.status, 200);
});
test("protected route without token returns 401", async () => {
  const r = await call("/api/cart");
  assert.strictEqual(r.status, 401);
  assert.strictEqual(r.body.success, false);
});
test("invalid token returns 401", async () => {
  const r = await call("/api/orders", { headers: { Authorization: "Bearer abc" } });
  assert.strictEqual(r.status, 401);
});
test("login with missing fields returns 400 and field errors", async () => {
  const r = await call("/api/auth/login", { method: "POST", body: JSON.stringify({}) });
  assert.strictEqual(r.status, 400);
  assert.ok(r.body.errors.length >= 1);
});
test("register with bad role is rejected", async () => {
  const r = await call("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "Al", email: "a@b.com", password: "123456", role: "admin" }) });
  assert.strictEqual(r.status, 400);
});
test("invalid product id returns 400", async () => {
  const r = await call("/api/products/123");
  assert.strictEqual(r.status, 400);
});
test("unknown route returns 404 JSON", async () => {
  const r = await call("/api/nothing");
  assert.strictEqual(r.status, 404);
});
test("invalid JSON body returns 400", async () => {
  const r = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{bad" });
  assert.strictEqual(r.status, 400);
});
