import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cartStorageKeyForOwner } from "../src/lib/cart-storage";
import {
  buildShippingAddressSnapshot,
  isMissingCustomerEmailColumn
} from "../src/lib/customer-account";
import { orderInputSchema, profileUpdateSchema } from "../src/lib/validations";

const validOrderInput = {
  fullName: "Nguyen Van A",
  phone: "0901234567",
  email: "guest@example.com",
  address: "123 Nguyen Trai",
  province: "Ho Chi Minh",
  district: "District 1",
  ward: "Ben Nghe",
  shippingRegion: "VIETNAM" as const,
  paymentMethod: "DEPOSIT_50_BANK_ZALO" as const,
  noChangePolicyAck: true,
  items: [
    {
      productId: "00000000-0000-4000-8000-000000000001",
      productVariantId: "00000000-0000-4000-8000-000000000101",
      quantity: 1,
      size: "M",
      color: "Black"
    }
  ]
};

describe("auth/account safety regressions", () => {
  it("accepts a valid guest email for verified account linkage later", () => {
    const parsed = orderInputSchema.safeParse({
      ...validOrderInput,
      email: " Guest@Example.com "
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.email, "Guest@Example.com");
    }
  });

  it("rejects checkout without a valid contact email", () => {
    assert.equal(
      orderInputSchema.safeParse({ ...validOrderInput, email: "not-an-email" }).success,
      false
    );
  });

  it("does not allow profile updates to mutate the auth lookup email", () => {
    const parsed = profileUpdateSchema.safeParse({
      fullName: "Nguyen Van A",
      email: "other@example.com"
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal("email" in parsed.data, false);
      assert.equal(parsed.data.fullName, "Nguyen Van A");
    }
  });

  it("keeps guest and signed-in carts in separate localStorage buckets", () => {
    assert.notEqual(
      cartStorageKeyForOwner(null),
      cartStorageKeyForOwner("user-123")
    );
    assert.notEqual(
      cartStorageKeyForOwner("user-123"),
      cartStorageKeyForOwner("user-456")
    );
  });

  it("builds an immutable order shipping snapshot from checkout input", () => {
    assert.deepEqual(buildShippingAddressSnapshot(validOrderInput), {
      recipientName: "Nguyen Van A",
      phone: "0901234567",
      country: "Vietnam",
      provinceCity: "Ho Chi Minh",
      district: "District 1",
      ward: "Ben Nghe",
      streetAddress: "123 Nguyen Trai",
      fullAddress: "123 Nguyen Trai, Ben Nghe, District 1, Ho Chi Minh",
      isInternational: false
    });
  });

  it("recognizes the local database missing Customer.email migration error", () => {
    assert.equal(
      isMissingCustomerEmailColumn({
        code: "P2022",
        meta: { modelName: "Customer", column: "Customer.email" }
      }),
      true
    );
  });
});
