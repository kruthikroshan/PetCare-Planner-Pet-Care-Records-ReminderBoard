const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../index");

test("health endpoint reports an available API", async () => {
  const server = app.listen(0);
  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
