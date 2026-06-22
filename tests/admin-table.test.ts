import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminTable } from "../src/components/admin-table";

describe("AdminTable empty state", () => {
  it("renders the configured empty message across all columns", () => {
    const html = renderToStaticMarkup(
      createElement(
        AdminTable,
        {
          headers: ["Order", "Status"],
          emptyMessage: "No orders yet."
        },
        null
      )
    );

    assert.match(html, /<td[^>]*col[Ss]pan="2"[^>]*>No orders yet\.<\/td>/);
  });

  it("renders the empty state for an empty fragment", () => {
    const html = renderToStaticMarkup(
      createElement(
        AdminTable,
        {
          headers: ["Order"],
          emptyMessage: "No orders yet."
        },
        createElement(Fragment)
      )
    );

    assert.match(html, />No orders yet\.<\/td>/);
  });

  it("renders rows without the empty message when records exist", () => {
    const html = renderToStaticMarkup(
      createElement(
        AdminTable,
        {
          headers: ["Order"],
          emptyMessage: "No orders yet."
        },
        createElement(
          "tr",
          null,
          createElement("td", null, "ORDER-001")
        )
      )
    );

    assert.doesNotMatch(html, /No orders yet\./);
    assert.match(html, /ORDER-001/);
  });
});
