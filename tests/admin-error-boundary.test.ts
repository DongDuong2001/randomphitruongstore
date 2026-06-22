import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminPanelError from "../src/app/admin/(panel)/error";

describe("admin panel error boundary", () => {
  it("does not expose the original error message in rendered output", () => {
    const sensitiveMessage = "Database password was rejected for admin@example.com";
    const html = renderToStaticMarkup(
      createElement(AdminPanelError, {
        error: new Error(sensitiveMessage),
        reset: () => undefined
      })
    );

    assert.doesNotMatch(html, new RegExp(sensitiveMessage));
    assert.match(html, /An unexpected error occurred\. Please try again\./);
  });
});
