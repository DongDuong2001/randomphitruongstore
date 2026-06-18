import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { productBasePrice, productVariantPrice } from "../src/lib/product-pricing";

describe("product pricing helpers", () => {
  it("uses basePrice for storefront display and filters when it exists", () => {
    assert.equal(
      productBasePrice({
        price: 2490000,
        basePrice: 2400000
      }),
      2400000
    );
  });

  it("falls back to legacy price while old product rows are still supported", () => {
    assert.equal(
      productBasePrice({
        price: 2490000,
        basePrice: null
      }),
      2490000
    );
  });

  it("adds variant price adjustments on top of the chosen product base price", () => {
    assert.equal(
      productVariantPrice(
        {
          price: 2490000,
          basePrice: 2400000
        },
        {
          priceAdjustment: 90000
        }
      ),
      2490000
    );
  });
});
