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
  address: "123 Nguyen Trai",
  province: "Ho Chi Minh",
  district: "District 1",
  ward: "Ben Nghe",
  shippingRegion: "VIETNAM",
  paymentMethod: "DEPOSIT_50_BANK_ZALO",
  items: [
    {
      productId: "00000000-0000-4000-8000-000000000001",
      quantity: 1,
      size: "M",
      color: "Black"
    }
  ]
};

describe("auth/account safety regressions", () => {
  it("does not accept client-supplied email for public order account linkage", () => {
    const parsed = orderInputSchema.safeParse({
      ...validOrderInput,
      email: "victim@example.com"
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal("email" in parsed.data, false);
    }
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
