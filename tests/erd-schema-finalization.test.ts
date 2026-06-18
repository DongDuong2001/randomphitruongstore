import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const schemaUrl = new URL("../prisma/schema.prisma", import.meta.url);
const migrationsUrl = new URL("../prisma/migrations/", import.meta.url);

async function readSchema() {
  return readFile(schemaUrl, "utf8");
}

function modelBlock(schema: string, modelName: string) {
  const match = schema.match(new RegExp(`model ${modelName} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `Expected Prisma schema to define model ${modelName}`);
  return match[1];
}

function modelField(schema: string, modelName: string, fieldName: string) {
  const block = modelBlock(schema, modelName);
  const line = block
    .split("\n")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${fieldName} `));

  assert.ok(line, `Expected ${modelName}.${fieldName} to exist`);
  return line;
}

async function readAllMigrationSql() {
  const entries = await readdir(migrationsUrl, { withFileTypes: true });
  const migrationDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const migrationSql = await Promise.all(
    migrationDirs.map((dir) =>
      readFile(new URL(`${dir}/migration.sql`, migrationsUrl), "utf8")
    )
  );

  return migrationSql.join("\n");
}

describe("ERD schema finalization", () => {
  it("keeps the expanded ERD models in the Prisma schema", async () => {
    const schema = await readSchema();
    const requiredModels = [
      "ShopSetting",
      "SocialLink",
      "BankAccount",
      "ZaloCommunity",
      "AdminUser",
      "Category",
      "ProductVariant",
      "SizeChart",
      "ProductInquiry",
      "InquiryImage",
      "ShippingAddress",
      "Payment",
      "PaymentProof",
      "OrderStatusHistory",
      "Shipment",
      "InternationalCountry",
      "InternationalShippingDetail",
      "ContactSubmission"
    ];

    for (const modelName of requiredModels) {
      modelBlock(schema, modelName);
    }
  });

  it("allows order items created from custom inquiries to omit catalog product links", async () => {
    const schema = await readSchema();

    assert.match(modelField(schema, "OrderItem", "productId"), /^productId\s+String\?/);
    assert.match(modelField(schema, "OrderItem", "product"), /^product\s+Product\?/);
    assert.match(
      modelField(schema, "OrderItem", "productVariantId"),
      /^productVariantId\s+String\?/
    );
    assert.match(
      modelField(schema, "OrderItem", "productVariant"),
      /^productVariant\s+ProductVariant\?/
    );
  });

  it("includes a forward migration that relaxes OrderItem catalog product constraints", async () => {
    const migrationSql = await readAllMigrationSql();

    assert.match(
      migrationSql,
      /ALTER TABLE "OrderItem"\s+ALTER COLUMN "productId" DROP NOT NULL/
    );
    assert.match(
      migrationSql,
      /FOREIGN KEY \("productId"\) REFERENCES "Product"\("id"\) ON DELETE SET NULL/
    );
  });
});
