import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cartItemKey } from "../src/components/cart-provider";
import { parseStoredCartItems } from "../src/lib/cart-storage";

describe("cart variant persistence", () => {
  it("keeps the selected product variant id when cart items are restored", () => {
    const [item] = parseStoredCartItems(
      JSON.stringify([
        {
          productId: "product-1",
          productVariantId: "variant-1",
          slug: "crane-sukajan",
          name: "Crane Sukajan",
          price: 2490000,
          imageUrl: "/uploads/crane.webp",
          size: "M",
          color: "Black",
          quantity: 1
        }
      ])
    );

    assert.equal(item.productVariantId, "variant-1");
  });

  it("uses productVariantId in the cart key so changed variant pricing cannot merge with legacy size/color entries", () => {
    assert.notEqual(
      cartItemKey({
        productId: "product-1",
        productVariantId: "variant-1",
        size: "M",
        color: "Black"
      }),
      cartItemKey({
        productId: "product-1",
        size: "M",
        color: "Black"
      })
    );
  });
});
