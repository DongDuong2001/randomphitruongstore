import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { saveCustomerProfileForEmail } from "../src/lib/customer-profile";

const schemaUrl = new URL("../prisma/schema.prisma", import.meta.url);

describe("customer profile lifecycle", () => {
  it("indexes Customer.email for account lookup queries", async () => {
    const schema = await readFile(schemaUrl, "utf8");
    const customerModel = schema.match(/model Customer \{([\s\S]*?)\n\}/)?.[1];

    assert.ok(customerModel, "Expected Prisma schema to define Customer");
    assert.match(customerModel, /@@index\(\[email\]\)/);
  });

  it("creates a customer profile on first save for a signed-in email", async () => {
    let createdCustomerData: unknown;
    const prisma = {
      customer: {
        findFirst: async () => null,
        update: async () => {
          assert.fail("Expected first profile save to create, not update");
        },
        create: async ({ data }: { data: Record<string, unknown> }) => {
          createdCustomerData = data;
          return {
            id: "11111111-1111-4111-8111-111111111111",
            ...data
          };
        }
      }
    };

    const saved = await saveCustomerProfileForEmail({
      prisma,
      email: "CUSTOMER@EXAMPLE.COM",
      authUserId: "auth-user-1",
      authFullName: "Auth Name",
      input: {
        fullName: "Profile Name",
        phone: "0901234567",
        address: "123 Nguyen Trai",
        province: "Ho Chi Minh",
        district: "District 1",
        ward: "Ben Nghe"
      }
    });

    assert.deepEqual(createdCustomerData, {
      email: "customer@example.com",
      fullName: "Profile Name",
      phone: "0901234567",
      address: "123 Nguyen Trai",
      province: "Ho Chi Minh",
      district: "District 1",
      ward: "Ben Nghe"
    });
    assert.equal(saved.email, "customer@example.com");
    assert.equal(saved.fullName, "Profile Name");
  });
});
