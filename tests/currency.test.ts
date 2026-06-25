import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  convertVndToUsd,
  defaultCurrencySettings,
  formatDisplayPrice,
  formatMoney,
  formatOrderSnapshotPrice,
  orderCurrencySnapshotFor,
  resolveCurrencySelection,
  validateCurrencySettings
} from "../src/lib/currency";

describe("currency conversion and formatting", () => {
  it("converts VND to USD using explicit VND per USD semantics", () => {
    assert.equal(convertVndToUsd(510000, 25500), 20);
  });

  it("formats VND without decimals and USD with two decimals", () => {
    assert.equal(formatMoney(510000, "VND"), "510.000 ₫");
    assert.equal(formatMoney(20, "USD"), "$20.00");
  });

  it("rejects zero and negative exchange rates", () => {
    assert.throws(() => convertVndToUsd(510000, 0), /greater than zero/);
    assert.throws(() => convertVndToUsd(510000, -25500), /greater than zero/);
  });

  it("validates supported currency settings", () => {
    assert.equal(
      validateCurrencySettings({
        defaultCurrency: "USD",
        vndEnabled: true,
        usdEnabled: true,
        vndPerUsd: 25500
      }).success,
      true
    );

    const invalidRate = validateCurrencySettings({
      defaultCurrency: "USD",
      vndEnabled: true,
      usdEnabled: true,
      vndPerUsd: 0
    });
    assert.equal(invalidRate.success, false);
  });

  it("falls back when the selected currency is disabled", () => {
    assert.equal(
      formatDisplayPrice(510000, "USD", {
        ...defaultCurrencySettings,
        usdEnabled: false,
        vndPerUsd: null
      }),
      "510.000 ₫"
    );
  });

  it("resolves manual choice, country default, admin default, then VND fallback", () => {
    const settings = {
      defaultCurrency: "VND" as const,
      vndEnabled: true,
      usdEnabled: true,
      vndPerUsd: 25500,
      exchangeRateUpdatedAt: null
    };

    assert.equal(
      resolveCurrencySelection({
        manualCurrency: "USD",
        countryCode: "VN",
        settings
      }),
      "USD"
    );
    assert.equal(
      resolveCurrencySelection({
        countryCode: "VN",
        settings
      }),
      "VND"
    );
    assert.equal(
      resolveCurrencySelection({
        countryCode: "US",
        settings
      }),
      "USD"
    );
  });

  it("captures and uses order display currency snapshots", () => {
    const settings = {
      defaultCurrency: "USD" as const,
      vndEnabled: true,
      usdEnabled: true,
      vndPerUsd: 25500,
      exchangeRateUpdatedAt: null
    };

    const snapshot = orderCurrencySnapshotFor("USD", settings);

    assert.deepEqual(snapshot, {
      displayCurrency: "USD",
      exchangeRateVndPerUsd: 25500
    });
    assert.equal(formatOrderSnapshotPrice(510000, snapshot), "$20.00");
    assert.equal(
      formatOrderSnapshotPrice(510000, {
        displayCurrency: "USD",
        exchangeRateVndPerUsd: 26000
      }),
      "$19.62"
    );
  });
});
