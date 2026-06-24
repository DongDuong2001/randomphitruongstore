import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAccessOrder,
  hashOrderAccessToken,
  verifyOrderAccessToken
} from "../src/lib/order-access";

describe("order access", () => {
  it("allows an authenticated customer with the matching Supabase user id", () => {
    assert.equal(
      canAccessOrder({
        authenticatedUserId: "auth-user-1",
        customerSupabaseUserId: "auth-user-1",
        accessToken: null,
        storedTokenHash: null
      }),
      true
    );
  });

  it("does not authorize by email when Supabase user id differs", () => {
    const accessAttempt = {
      authenticatedUserId: "attacker-user",
      customerSupabaseUserId: "victim-user",
      authenticatedEmail: "victim@example.com",
      customerEmail: "victim@example.com",
      accessToken: null,
      storedTokenHash: null
    };

    assert.equal(
      canAccessOrder(accessAttempt),
      false
    );
  });

  it("allows a guest only with the matching raw tracking token", () => {
    const storedTokenHash = hashOrderAccessToken("guest-secret-token");

    assert.equal(
      canAccessOrder({
        authenticatedUserId: null,
        customerSupabaseUserId: null,
        accessToken: "guest-secret-token",
        storedTokenHash
      }),
      true
    );
    assert.equal(verifyOrderAccessToken("wrong-token", storedTokenHash), false);
  });

  it("denies anonymous, wrong-account, missing-token, and legacy null-token access", () => {
    const storedTokenHash = hashOrderAccessToken("guest-secret-token");

    assert.equal(
      canAccessOrder({
        authenticatedUserId: "attacker-user",
        customerSupabaseUserId: "customer-user",
        accessToken: null,
        storedTokenHash
      }),
      false
    );
    assert.equal(
      canAccessOrder({
        authenticatedUserId: null,
        customerSupabaseUserId: null,
        accessToken: null,
        storedTokenHash
      }),
      false
    );
    assert.equal(
      canAccessOrder({
        authenticatedUserId: null,
        customerSupabaseUserId: null,
        accessToken: "anything",
        storedTokenHash: null
      }),
      false
    );
  });
});
