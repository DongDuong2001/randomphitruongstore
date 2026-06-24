import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { registrationClientResult } from "../src/lib/auth-registration";

describe("registration error normalization", () => {
  it("returns the same generic client response for duplicate provider errors", () => {
    const result = registrationClientResult({
      user: null,
      error: { message: "User already registered" }
    });

    assert.equal(result.status, 201);
    assert.deepEqual(result.body, {
      user: null,
      message: "If registration is available for this email, you will receive account instructions."
    });
    assert.equal(JSON.stringify(result).includes("already registered"), false);
  });

  it("does not expose raw provider errors for valid registration attempts", () => {
    const result = registrationClientResult({
      user: null,
      error: { message: "Supabase provider internal stack detail" }
    });

    assert.equal(result.status, 201);
    assert.equal(JSON.stringify(result).includes("Supabase provider"), false);
  });
});
