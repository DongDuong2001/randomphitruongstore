import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const configUrl = new URL("../next.config.ts", import.meta.url);

describe("production security headers", () => {
  it("configures common browser security headers in Next.js", async () => {
    const config = await readFile(configUrl, "utf8");

    for (const header of [
      "Strict-Transport-Security",
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy"
    ]) {
      assert.match(config, new RegExp(`key:\\s*["']${header}["']`));
    }

    assert.match(config, /frame-ancestors 'none'/);
    assert.match(config, /X-Content-Type-Options["'],\s*value:\s*["']nosniff/);
  });
});
