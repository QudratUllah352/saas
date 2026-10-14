require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const Deal = require("../models/Deal");
const Product = require("../models/Product");
const Category = require("../models/Category");

const BASE_URL = "http://localhost:5000";

let testSuperAdminId = null;
let testEditorId = null;
let testDealId = null;
let testProductId = null;
let testCategoryId = null;

async function runTests() {
  console.log("=== STARTING SAASPIN AUTH & TEAM AUTOMATED TESTS ===");
  
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI not found in saaspic-backend/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✓ Connected to MongoDB for test verification & cleanup setup");

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failedCount++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Anti-enumeration on forgot password
    // -------------------------------------------------------------
    console.log("\n[Test 1] Password Reset Anti-Enumeration");
    const fakeEmailRes = await fetch(`${BASE_URL}/api/admin/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent-user-9999@saaspin.test" }),
    });
    const fakeEmailData = await fakeEmailRes.json();
    assert(
      fakeEmailRes.status === 200 && typeof fakeEmailData.message === "string",
      "Non-existent email returns generic 200 message to prevent email enumeration"
    );

    // -------------------------------------------------------------
    // Setup isolated test superadmin
    // -------------------------------------------------------------
    const testAdminEmail = `superadmin-${Date.now()}@saaspin.test`;
    const testAdminPassword = "SecureSuperPassword123!";
    const hashedPass = await bcrypt.hash(testAdminPassword, 12);
    
    const superAdminDoc = await Admin.create({
      name: "Test SuperAdmin",
      email: testAdminEmail,
      password: hashedPass,
      role: "superadmin",
      status: "active",
    });
    testSuperAdminId = superAdminDoc._id;

    // -------------------------------------------------------------
    // Test 2: Admin Login & JWT session
    // -------------------------------------------------------------
    console.log("\n[Test 2] Admin Login & JWT session");
    const badLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testAdminEmail, password: "WrongPassword123" }),
    });
    assert(badLoginRes.status === 401, "Bad password rejected with 401 Unauthorized");

    const goodLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testAdminEmail, password: testAdminPassword }),
    });
    const goodLoginData = await goodLoginRes.json();
    assert(goodLoginRes.status === 200 && !!goodLoginData.token, "Valid login returns 200 and JWT token");
    assert(goodLoginData.admin.role === "superadmin", "Returned admin object has role 'superadmin'");
    
    const superAdminToken = goodLoginData.token;

    // -------------------------------------------------------------
    // Test 3: /api/admin/me session verification
    // -------------------------------------------------------------
    console.log("\n[Test 3] Session verification /api/admin/me");
    const meRes = await fetch(`${BASE_URL}/api/admin/me`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.admin.email === testAdminEmail, "/api/admin/me verifies token and returns admin profile");

    // -------------------------------------------------------------
    // Test 4: Team Member Invitation
    // -------------------------------------------------------------
    console.log("\n[Test 4] Team Member Invitation");
    const testEditorEmail = `editor-${Date.now()}@saaspin.test`;
    const inviteRes = await fetch(`${BASE_URL}/api/admin/team/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        email: testEditorEmail,
        name: "Test Editor User",
        role: "editor",
      }),
    });
    const inviteData = await inviteRes.json();
    assert(inviteRes.status === 201 && inviteData.member.role === "editor", "Super Admin can invite new Editor");

    testEditorId = inviteData.member.id || inviteData.member._id;

    // Retrieve raw invite token stored or created
    const editorInDb = await Admin.findById(testEditorId);
    assert(
      editorInDb && editorInDb.status === "invited" && !!editorInDb.inviteToken,
      "Editor record exists in DB with status 'invited' and hashed inviteToken"
    );

    // -------------------------------------------------------------
    // Test 5: Verify & Accept Invitation
    // -------------------------------------------------------------
    console.log("\n[Test 5] Verify & Accept Invitation");
    // Extract raw token from inviteUrl
    let rawInviteToken = null;
    if (inviteData.inviteUrl) {
      const parsedUrl = new URL(inviteData.inviteUrl);
      rawInviteToken = parsedUrl.searchParams.get("token");
    }
    assert(!!rawInviteToken, "Dev inviteUrl contains valid raw invitation token");

    const verifyInviteRes = await fetch(`${BASE_URL}/api/admin/invite/verify?token=${rawInviteToken}`);
    const verifyInviteData = await verifyInviteRes.json();
    assert(verifyInviteRes.status === 200 && verifyInviteData.valid === true, "Invite token verifies successfully");

    const newEditorPassword = "SecureEditorPassword456!";
    const acceptInviteRes = await fetch(`${BASE_URL}/api/admin/invite/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawInviteToken,
        name: "Active Test Editor",
        password: newEditorPassword,
      }),
    });
    const acceptInviteData = await acceptInviteRes.json();
    assert(
      acceptInviteRes.status === 200 && !!acceptInviteData.token,
      "Accepting invitation activates account and returns JWT token"
    );

    const editorToken = acceptInviteData.token;

    // -------------------------------------------------------------
    // Test 6: Role-Based Access Control (RBAC) Enforcement
    // -------------------------------------------------------------
    console.log("\n[Test 6] RBAC Route Protection");
    // Editor attempts to access Team Management -> should be 403 Forbidden
    const editorTeamRes = await fetch(`${BASE_URL}/api/admin/team`, {
      headers: { Authorization: `Bearer ${editorToken}` },
    });
    assert(editorTeamRes.status === 403, "Editor is FORBIDDEN (403) from accessing /api/admin/team");

    // Editor attempts to access Affiliate Management -> should be 403 Forbidden
    const editorAffiliateRes = await fetch(`${BASE_URL}/api/affiliate/stats`, {
      headers: { Authorization: `Bearer ${editorToken}` },
    });
    assert(editorAffiliateRes.status === 403, "Editor is FORBIDDEN (403) from accessing /api/affiliate/stats");

    // Super Admin CAN access Team Management
    const superAdminTeamRes = await fetch(`${BASE_URL}/api/admin/team`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert(superAdminTeamRes.status === 200, "Super Admin is ALLOWED (200) to access /api/admin/team");

    // -------------------------------------------------------------
    // Test 7: Password Reset Workflow & Session Revocation
    // -------------------------------------------------------------
    console.log("\n[Test 7] Password Reset Workflow & Session Revocation");
    const forgotRes = await fetch(`${BASE_URL}/api/admin/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEditorEmail }),
    });
    const forgotData = await forgotRes.json();
    assert(forgotRes.status === 200, "Password reset requested successfully");

    let rawResetToken = null;
    if (forgotData.devResetUrl) {
      const parsedResetUrl = new URL(forgotData.devResetUrl);
      rawResetToken = parsedResetUrl.searchParams.get("token");
    }
    assert(!!rawResetToken, "Reset token generated and accessible via dev URL for testing");

    // Verify reset token endpoint
    const verifyResetRes = await fetch(`${BASE_URL}/api/admin/reset-password/verify?token=${rawResetToken}`);
    const verifyResetData = await verifyResetRes.json();
    assert(verifyResetRes.status === 200 && verifyResetData.valid === true, "Reset token verified successfully");

    // Complete reset with brand new password
    const brandNewPassword = "BrandNewPassword789!";
    const completeResetRes = await fetch(`${BASE_URL}/api/admin/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawResetToken,
        password: brandNewPassword,
      }),
    });
    assert(completeResetRes.status === 200, "Password reset completed successfully");

    // Stale JWT token check: the old editorToken was issued before passwordChangedAt
    const staleCheckRes = await fetch(`${BASE_URL}/api/admin/me`, {
      headers: { Authorization: `Bearer ${editorToken}` },
    });
    assert(
      staleCheckRes.status === 401,
      "Stale JWT issued prior to password reset is immediately REVOKED (401)"
    );

    // Old password fails
    const oldPassLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEditorEmail, password: newEditorPassword }),
    });
    assert(oldPassLoginRes.status === 401, "Old password rejected after reset");

    // New password succeeds
    const newPassLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEditorEmail, password: brandNewPassword }),
    });
    assert(newPassLoginRes.status === 200, "New password logs in successfully");

    // Single-use token check: reusing same reset token should fail
    const reuseResetRes = await fetch(`${BASE_URL}/api/admin/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawResetToken,
        password: "YetAnotherPassword123!",
      }),
    });
    assert(reuseResetRes.status === 400, "Reset token is single-use and cannot be reused");

    // -------------------------------------------------------------
    // Test 8: Rate Limiting on Forgot Password
    // -------------------------------------------------------------
    console.log("\n[Test 8] Rate Limiting on Forgot Password");
    // Send rapid requests to exceed rate limit (threshold = 3 per 15 min)
    let triggeredRateLimit = false;
    for (let i = 0; i < 4; i++) {
      const r = await fetch(`${BASE_URL}/api/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `rate-attempt-${i}@saaspin.test` }),
      });
      if (r.status === 429) {
        triggeredRateLimit = true;
        break;
      }
    }
    assert(triggeredRateLimit, "Rate limiter triggers 429 Too Many Requests when rate threshold exceeded");

    // -------------------------------------------------------------
    // Test 9: Concurrency Conflict Detection (409 Conflict)
    // -------------------------------------------------------------
    console.log("\n[Test 9] Concurrency Conflict Detection");
    // Create temporary category & product & deal
    const tempCat = await Category.create({ name: "Temp Test Cat", slug: `temp-cat-${Date.now()}` });
    testCategoryId = tempCat._id;

    const tempProd = await Product.create({
      name: "Temp Test Product",
      slug: `temp-prod-${Date.now()}`,
      category: tempCat._id,
      website: "https://example.com",
      description: "Temp product for concurrency test",
    });
    testProductId = tempProd._id;

    const tempDeal = await Deal.create({
      product: tempProd._id,
      discount: "50% OFF",
      price: 49,
      oldPrice: 99,
      dealUrl: "https://example.com/deal",
      dealType: "lifetime",
    });
    testDealId = tempDeal._id;

    // Simulate Client A holding an outdated timestamp
    const staleTimestamp = new Date(Date.now() - 60000).toISOString();
    const conflictUpdateRes = await fetch(`${BASE_URL}/api/deals/${testDealId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        discount: "60% OFF",
        lastKnownUpdatedAt: staleTimestamp,
      }),
    });
    const conflictData = await conflictUpdateRes.json();
    assert(
      conflictUpdateRes.status === 409 && conflictData.conflict === true,
      "Concurrent overwrite is PREVENTED with 409 Conflict status"
    );

    // Update with current timestamp succeeds
    const freshDeal = await Deal.findById(testDealId);
    const validUpdateRes = await fetch(`${BASE_URL}/api/deals/${testDealId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        discount: "70% OFF",
        lastKnownUpdatedAt: freshDeal.updatedAt.toISOString(),
      }),
    });
    assert(validUpdateRes.status === 200, "Update with fresh timestamp succeeds without conflict");

  } finally {
    // -------------------------------------------------------------
    // CLEANUP: Clean all test entities from MongoDB
    // -------------------------------------------------------------
    console.log("\n[Cleanup] Removing temporary test entities from MongoDB...");
    if (testSuperAdminId) await Admin.findByIdAndDelete(testSuperAdminId);
    if (testEditorId) await Admin.findByIdAndDelete(testEditorId);
    if (testDealId) await Deal.findByIdAndDelete(testDealId);
    if (testProductId) await Product.findByIdAndDelete(testProductId);
    if (testCategoryId) await Category.findByIdAndDelete(testCategoryId);
    await mongoose.disconnect();
    console.log("✓ MongoDB disconnected. Test entities removed.");
  }

  console.log("\n=======================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution threw error:", err);
  process.exit(1);
});
