const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");
const authRoutes = require("../routes/auth");
const User = require("../models/User");
const { getJwtSecret } = require("../config/jwt");
const { requireAuth } = require("../middleware/auth");

const originalFindById = User.findById;
const originalExists = User.exists;
const originalCreate = User.create;
const originalFindOne = User.findOne;
const secret = "test-secret-with-at-least-32-bytes";
process.env.JWT_SECRET = secret;
const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

test.afterEach(() => {
  User.findById = originalFindById;
  User.exists = originalExists;
  User.create = originalCreate;
  User.findOne = originalFindOne;
});

async function sendJson(path, body) {
  const server = app.listen(0);
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test("JWT secret must be at least 32 bytes", () => {
  process.env.JWT_SECRET = "short-secret";
  assert.throws(() => getJwtSecret(), /at least 32 bytes/);

  process.env.JWT_SECRET = secret;
  assert.equal(getJwtSecret(), secret);
});

test("User password hash is excluded from query results by default", () => {
  assert.equal(User.schema.path("passwordHash").options.select, false);
});

test("registration validates input before accessing the database", async () => {
  User.exists = async () => {
    assert.fail("database should not be queried for invalid input");
  };

  const result = await sendJson("/api/auth/register", {
    name: "Test User",
    email: "not-an-email",
    password: "short"
  });

  assert.equal(result.status, 400);
});

test("registration stores a hash and returns a token without exposing the hash", async () => {
  let storedHash;
  User.exists = async () => null;
  User.create = async (input) => {
    storedHash = input.passwordHash;
    return { _id: "user-123", name: input.name, email: input.email, passwordHash: input.passwordHash };
  };

  const result = await sendJson("/api/auth/register", {
    name: " Test User ",
    email: "TEST@example.com",
    password: "correct-horse-42"
  });

  assert.equal(result.status, 201);
  assert.equal(await bcrypt.compare("correct-horse-42", storedHash), true);
  assert.deepEqual(result.body.user, { name: "Test User", email: "test@example.com" });
  assert.equal(jwt.verify(result.body.token, secret, { algorithms: ["HS256"] }).sub, "user-123");
  assert.equal("passwordHash" in result.body.user, false);
});

test("login returns the same unauthorized response for unknown users and bad passwords", async () => {
  User.findOne = () => ({ select: async () => null });

  const result = await sendJson("/api/auth/login", {
    email: "missing@example.com",
    password: "wrong-password"
  });

  assert.equal(result.status, 401);
  assert.equal(result.body.message, "Email or password is incorrect.");
});

test("login returns a token when the password matches", async () => {
  const passwordHash = await bcrypt.hash("correct-horse-42", 4);
  const user = {
    _id: "user-123",
    name: "Test User",
    email: "test@example.com",
    passwordHash
  };
  User.findOne = (query) => {
    assert.deepEqual(query, { email: "test@example.com" });
    return {
      select: async (projection) => {
        assert.equal(projection, "+passwordHash");
        return user;
      }
    };
  };

  const result = await sendJson("/api/auth/login", {
    email: "TEST@example.com",
    password: "correct-horse-42"
  });

  assert.equal(result.status, 200);
  assert.equal(jwt.verify(result.body.token, secret, { algorithms: ["HS256"] }).sub, "user-123");
  assert.deepEqual(result.body.user, { name: "Test User", email: "test@example.com" });
});

test("authentication rejects requests without a bearer token", async () => {
  const res = response();

  await requireAuth({ headers: {} }, res, () => {
    assert.fail("next should not be called");
  });

  assert.equal(res.statusCode, 401);
});

test("authentication rejects malformed and non-HS256 tokens", async () => {
  const res = response();
  const token = jwt.sign({}, secret, {
    algorithm: "HS384",
    subject: "user-123"
  });

  await requireAuth({ headers: { authorization: `Bearer ${token}` } }, res, () => {
    assert.fail("next should not be called");
  });

  assert.equal(res.statusCode, 401);
});

test("authentication loads the token subject as the current user", async (context) => {
  const user = {
    _id: { toString: () => "user-123" },
    name: "Test User",
    email: "test@example.com"
  };
  User.findById = async (id) => (id === "user-123" ? user : null);
  context.after(() => {
    User.findById = originalFindById;
  });

  const token = jwt.sign({}, secret, {
    algorithm: "HS256",
    subject: "user-123"
  });
  const req = { headers: { authorization: `Bearer ${token}` } };
  let continued = false;

  await requireAuth(req, response(), () => {
    continued = true;
  });

  assert.deepEqual(req.user, {
    id: "user-123",
    name: "Test User",
    email: "test@example.com"
  });
  assert.equal(continued, true);
});
