import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { orderInputSchema } from "../src/lib/validations";

const disabledPaymentMethods = ["ONLINE_100_VNPAY", "ONLINE_100_MOMO"];

const checkoutInput = {
  fullName: "Nguyen Van A",
  phone: "0901234567",
  email: "guest@example.com",
  address: "123 Nguyen Trai",
  province: "Ho Chi Minh",
  district: "District 1",
  ward: "Ben Nghe",
  shippingRegion: "VIETNAM",
  noChangePolicyAck: true,
  items: [{
    productId: "00000000-0000-4000-8000-000000000001",
    productVariantId: "00000000-0000-4000-8000-000000000101",
    quantity: 1,
    size: "M",
    color: "Black"
  }]
};

describe("payment method availability", () => {
  it("rejects VNPay and MoMo for new orders", () => {
    for (const paymentMethod of disabledPaymentMethods) {
      assert.equal(
        orderInputSchema.safeParse({ ...checkoutInput, paymentMethod }).success,
        false,
        `${paymentMethod} should no longer be accepted`
      );
    }
  });

  it("accepts DEPOSIT_50_BANK_ZALO and ONLINE_100_SEPAY", () => {
    for (const paymentMethod of ["DEPOSIT_50_BANK_ZALO", "ONLINE_100_SEPAY"]) {
      assert.equal(
        orderInputSchema.safeParse({ ...checkoutInput, paymentMethod }).success,
        true,
        `${paymentMethod} should be accepted`
      );
    }
  });

  it("VNPay and MoMo are removed from checkout UI", async () => {
    const checkout = await readFile("src/components/checkout-form.tsx", "utf8");
    assert.doesNotMatch(checkout, /value="ONLINE_100_VNPAY"/, "VNPay should be removed from UI");
    assert.doesNotMatch(checkout, /value="ONLINE_100_MOMO"/, "MoMo should be removed from UI");
  });

  it("retains VNPay and MoMo database enum values for historical orders", async () => {
    const schema = await readFile("prisma/schema.prisma", "utf8");

    for (const paymentMethod of disabledPaymentMethods) {
      assert.match(schema, new RegExp(`\\b${paymentMethod}\\b`));
    }
  });

  it("keeps the retired VNPay and MoMo routes absent", async () => {
    for (const route of [
      "src/app/api/payment/vnpay-placeholder/route.ts",
      "src/app/api/payment/momo-placeholder/route.ts"
    ]) {
      await assert.rejects(access(route), { code: "ENOENT" });
    }
  });

  it("does not retain the unused payment placeholder response helper", async () => {
    const paymentResponses = await readFile("src/lib/payment-placeholder.ts", "utf8");

    assert.doesNotMatch(paymentResponses, /paymentPlaceholderResponse/);
  });
});
