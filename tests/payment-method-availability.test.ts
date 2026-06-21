import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { orderInputSchema } from "../src/lib/validations";

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

describe("existing payment method availability", () => {
  it("continues accepting VNPay and MoMo orders", () => {
    for (const paymentMethod of ["ONLINE_100_VNPAY", "ONLINE_100_MOMO"]) {
      assert.equal(
        orderInputSchema.safeParse({ ...checkoutInput, paymentMethod }).success,
        true
      );
    }
  });

  it("keeps VNPay and MoMo in checkout UI and preserves their routes", async () => {
    const checkout = await readFile("src/components/checkout-form.tsx", "utf8");
    assert.match(checkout, /value="ONLINE_100_VNPAY"/);
    assert.match(checkout, /value="ONLINE_100_MOMO"/);
    await access("src/app/api/payment/vnpay-placeholder/route.ts");
    await access("src/app/api/payment/momo-placeholder/route.ts");
  });
});
