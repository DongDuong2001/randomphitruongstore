import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const fullGalleryQuery = 'images: { orderBy: { sortOrder: "asc" } }';

async function readSource(path: string) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

describe("product image query shapes", () => {
  it("fetches only the ordered primary image for product listing contexts", async () => {
    const sources = await Promise.all([
      readSource("../src/lib/public-catalog.ts"),
      readSource("../src/app/api/products/route.ts"),
      readSource("../src/app/(store)/checkout/page.tsx")
    ]);

    for (const source of sources) {
      assert.match(source, /take: 1/);
      assert.match(source, /images: \{/);
    }

    assert.match(sources[0], /getPublicShopProducts/);
  });

  it("keeps the product detail gallery query as the complete ordered image list", async () => {
    const querySource = await readSource("../src/lib/public-catalog.ts");
    const pageSource = await readSource("../src/app/(store)/shop/[slug]/page.tsx");

    assert.match(querySource, new RegExp(escapeRegExp(fullGalleryQuery)));
    assert.match(querySource, /getPublicProductBySlug/);
    assert.match(pageSource, /<ProductGallery/);
  });
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
