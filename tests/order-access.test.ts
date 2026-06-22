import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAccessOrder,
  hashOrderAccessToken,
  verifyOrderAccessToken
} from "../src/lib/order-access";

describe("order access", () => {
  it("allows an authenticated customer with the same normalized email", () => {
    assert.equal(
      canAccessOrder({
        authenticatedEmail: " CUSTOMER@EXAMPLE.COM ",
        customerEmail: "customer@example.com",
        accessToken: null,
        storedTokenHash: null
      }),
      true
    );
  });

  it("allows a guest only with the matching raw tracking token", () => {
    const storedTokenHash = hashOrderAccessToken("guest-secret-token");

    assert.equal(
      canAccessOrder({
        authenticatedEmail: null,
        customerEmail: "guest@example.com",
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
        authenticatedEmail: "attacker@example.com",
        customerEmail: "customer@example.com",
        accessToken: null,
        storedTokenHash
      }),
      false
    );
    assert.equal(
      canAccessOrder({
        authenticatedEmail: null,
        customerEmail: "guest@example.com",
        accessToken: null,
        storedTokenHash
      }),
      false
    );
    assert.equal(
      canAccessOrder({
        authenticatedEmail: null,
        customerEmail: "guest@example.com",
        accessToken: "anything",
        storedTokenHash: null
      }),
      false
    );
  });
});
