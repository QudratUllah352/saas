const test = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
// Explicit empty optional services prevent dotenv from loading real service credentials.
Object.assign(process.env, { NODE_ENV: "test", JWT_SECRET: randomBytes(32).toString("hex"), GEMINI_API_KEY: "", SMTP_HOST: "", SMTP_USER: "", SMTP_PASS: "", FRONTEND_URL: "http://localhost:3000" });
const { app } = require("../server");
const Admin = require("../models/Admin");
const Submission = require("../models/DealSubmission");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { frontendOrigin, validateEnvironment } = require("../config/environment");

test("production environment requires origins, database, strong JWT and email configuration", () => {
  const env = { NODE_ENV: "production", FRONTEND_URL: "https://saaspin.example", MONGODB_URI: "mongodb://127.0.0.1/disposable_not_connected", JWT_SECRET: "a".repeat(48), SMTP_HOST: "mail.example", SMTP_USER: "placeholder", SMTP_PASS: "placeholder", SMTP_FROM: "hello@example.com" };
  assert.equal(validateEnvironment(env).origin, env.FRONTEND_URL);
  for (const key of ["FRONTEND_URL", "MONGODB_URI", "JWT_SECRET", "SMTP_HOST", "SMTP_FROM"]) assert.throws(() => validateEnvironment({ ...env, [key]: "" }));
  assert.throws(() => frontendOrigin({ NODE_ENV: "production", FRONTEND_URL: "https://localhost" }));
  assert.throws(() => validateEnvironment({ ...env, TRUST_PROXY: "true" }));
});

test("HTTP submission, admin login/moderation and authorization with disposable memory records", async () => {
  const originals = { findOne: Admin.findOne, findById: Admin.findById, create: Submission.create, find: Submission.find, byId: Submission.findById };
  const admin = new Admin({ name: "Disposable administrator", email: "disposable@example.invalid", password: await bcrypt.hash("Disposable-password-123!", 4), role: "admin", status: "active" });
  admin.save = async () => admin;
  const records = [];
  Admin.findOne = async query => query.email === admin.email ? admin : null;
  Admin.findById = () => ({ select: async () => admin });
  Submission.create = async fields => { const item = new Submission(fields); await item.validate(); item.save = async () => item; records.push(item); return item; };
  Submission.find = () => ({ sort: async () => records });
  Submission.findById = async id => records.find(item => String(item._id) === id) || null;
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = (path, method = "GET", body, token) => fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    assert.equal((await request("/health")).status, 503, "health is not ready without a database");
    const cors = await fetch(base + "/health", { headers: { Origin: "http://localhost:3000" } });
    assert.equal(cors.headers.get("access-control-allow-origin"), "http://localhost:3000");
    const deniedCors = await fetch(base + "/health", { headers: { Origin: "https://untrusted.example" } });
    assert.equal(deniedCors.headers.get("access-control-allow-origin"), null);
    assert.equal((await request("/deal-submissions")).status, 401);
    assert.equal((await request("/deal-submissions", "POST", { productName: "Incomplete" })).status, 400);
    const created = await request("/deal-submissions", "POST", { productName: "Disposable deployment check", website: "https://example.invalid", email: "disposable@example.invalid", category: "development", deal: "Test only, not a business offer", description: "Disposable memory-only submission." });
    assert.equal(created.status, 201);
    const id = String((await created.json()).submission._id);
    assert.equal((await request(`/deal-submissions/${id}/approve`, "PATCH", {})).status, 401);
    assert.equal((await request("/admin/login", "POST", { email: {}, password: "x" })).status, 400);
    assert.equal((await request("/admin/login", "POST", { email: admin.email, password: "wrong" })).status, 401);
    const login = await request("/admin/login", "POST", { email: admin.email, password: "Disposable-password-123!" });
    assert.equal(login.status, 200);
    assert.equal(login.headers.get("set-cookie"), null, "auth uses Bearer tokens, not cookies");
    const { token } = await login.json();
    assert.equal((await request("/admin/me", "GET", null, token)).status, 200);
    const list = await request("/deal-submissions", "GET", null, token);
    assert.equal(list.status, 200); assert.equal((await list.json()).length, 1);
    assert.equal((await request(`/deal-submissions/${id}/approve`, "PATCH", {}, token)).status, 200);
    assert.equal(records[0].status, "approved");
    admin.role = "editor";
    const staleElevated = jwt.sign({ id: admin._id, role: "superadmin" }, process.env.JWT_SECRET);
    assert.equal((await request(`/admin/team/${admin._id}/role`, "PATCH", { role: "superadmin" }, staleElevated)).status, 403);
    admin.status = "invited";
    assert.equal((await request("/admin/me", "GET", null, token)).status, 403);
    admin.status = "deactivated";
    assert.equal((await request("/admin/me", "GET", null, token)).status, 403);
    admin.status = "active"; admin.passwordChangedAt = new Date(Date.now() + 2000);
    assert.equal((await request("/admin/me", "GET", null, token)).status, 401);
    admin.passwordChangedAt = null;
    assert.equal((await request("/ai/reviews/generate", "POST", {}, token)).status, 503);
    const invalidJson = await fetch(base + "/deal-submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
    assert.equal(invalidJson.status, 400);
  } finally {
    Admin.findOne = originals.findOne; Admin.findById = originals.findById;
    Submission.create = originals.create; Submission.find = originals.find; Submission.findById = originals.byId;
    records.length = 0;
    await new Promise(resolve => server.close(resolve));
  }
});

test("production SMTP fallback cannot disclose reset/invitation links", async () => {
  process.env.NODE_ENV = "production";
  try {
    const mail = require("../utils/emailService");
    await assert.rejects(mail.sendPasswordResetEmail({ email: "test@example.invalid", resetUrl: "https://saaspin.example/reset-password?token=disposable" }), /SMTP/);
    await assert.rejects(mail.sendTeamInviteEmail({ email: "test@example.invalid", inviteUrl: "https://saaspin.example/accept-invite?token=disposable" }), /SMTP/);
  } finally { process.env.NODE_ENV = "test"; }
});

test("production CORS allows the configured frontend but not localhost", () => {
  const result = require("node:child_process").spawnSync(process.execPath, ["-e", `
    const assert = require('node:assert/strict');
    const {app} = require('./server');
    const server = app.listen(0, '127.0.0.1', async () => {
      try {
        const url = 'http://127.0.0.1:' + server.address().port + '/api/health';
        for (const origin of ['http://localhost:3000', 'https://untrusted.example', 'https://saaspin.example']) {
          const r = await fetch(url, {headers:{Origin:origin}});
          assert.equal(r.headers.get('access-control-allow-origin'), origin === 'https://saaspin.example' ? origin : null);
          assert.equal(r.headers.get('access-control-allow-credentials'), null);
        }
      } catch { process.exitCode = 1; }
      finally { server.close(); }
    });
  `], { cwd: require("node:path").join(__dirname, ".."), env: { ...process.env, NODE_ENV: "production", FRONTEND_URL: "https://saaspin.example" }, encoding: "utf8", timeout: 10000 });
  assert.equal(result.status, 0, "Production CORS subprocess");
});

test("login limiter rejects repeated requests and recovers after its window", () => {
  let time = 0, count = 0, status;
  const middleware = require("../middleware/loginRateLimit").createLoginRateLimit({ limit: 2, windowMs: 1000, now: () => time });
  const res = { set() {}, status(code) { status = code; return this; }, json() {} };
  const request = () => middleware({ method: "POST", ip: "disposable" }, res, () => count++);
  request(); request(); request(); assert.equal(count, 2); assert.equal(status, 429);
  time = 1001; request(); assert.equal(count, 3);
});
