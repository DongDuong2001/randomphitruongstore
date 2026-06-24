import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { saveCustomerProfileForEmail } from "../src/lib/customer-profile";

const schemaUrl = new URL("../prisma/schema.prisma", import.meta.url);

describe("customer profile lifecycle", () => {
  it("stores a unique Supabase user id for customer account ownership", async () => {
    const schema = await readFile(schemaUrl, "utf8");
    const customerModel = schema.match(/model Customer \{([\s\S]*?)\n\}/)?.[1];

    assert.ok(customerModel, "Expected Prisma schema to define Customer");
    assert.match(customerModel, /supabaseUserId\s+String\?\s+@unique/);
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
            fullName: String(data.fullName),
            phone: String(data.phone),
            email: String(data.email),
            zaloPhone: null,
            instagramHandle: null,
            preferredLanguage: "vi"
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
        phone: "0901234567"
      }
    });

    assert.deepEqual(createdCustomerData, {
      supabaseUserId: "auth-user-1",
      email: "customer@example.com",
      fullName: "Profile Name",
      phone: "0901234567"
    });
    assert.equal(saved.email, "customer@example.com");
    assert.equal(saved.fullName, "Profile Name");
  });

  it("does not claim a historical customer row solely because the email matches", async () => {
    let customerLookupWhere: Record<string, unknown> | null = null;
    let createdCustomerData: Record<string, unknown> | null = null;
    let updatedHistoricalCustomerData: Record<string, unknown> | null = null;
    const prisma = {
      customer: {
        findFirst: async ({ where }: { where: Record<string, unknown> }) => {
          customerLookupWhere = where;
          if (where.email === "customer@example.com") {
            return { id: "historical-customer" };
          }
          return null;
        },
        update: async ({ data }: { data: Record<string, unknown> }) => {
          updatedHistoricalCustomerData = data;
          return {
            id: "historical-customer",
            fullName: String(data.fullName),
            phone: String(data.phone),
            email: "customer@example.com",
            zaloPhone: null,
            instagramHandle: null,
            preferredLanguage: "vi"
          };
        },
        create: async ({ data }: { data: Record<string, unknown> }) => {
          createdCustomerData = data;
          return {
            id: "22222222-2222-4222-8222-222222222222",
            fullName: String(data.fullName),
            phone: String(data.phone),
            email: String(data.email),
            zaloPhone: null,
            instagramHandle: null,
            preferredLanguage: "vi"
          };
        }
      }
    };

    const saved = await saveCustomerProfileForEmail({
      prisma,
      email: "CUSTOMER@EXAMPLE.COM",
      authUserId: "auth-user-2",
      authFullName: "Auth Name",
      input: {
        fullName: "New Owner",
        phone: "0907654321"
      }
    });

    assert.deepEqual(customerLookupWhere, { supabaseUserId: "auth-user-2" });
    assert.equal(updatedHistoricalCustomerData, null);
    assert.deepEqual(createdCustomerData, {
      supabaseUserId: "auth-user-2",
      email: "customer@example.com",
      fullName: "New Owner",
      phone: "0907654321"
    });
    assert.equal(saved.id, "22222222-2222-4222-8222-222222222222");
  });
});
