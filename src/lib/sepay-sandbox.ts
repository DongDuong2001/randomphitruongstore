export const SEPAY_SANDBOX_PROVIDER = "SEPAY_SANDBOX";

export function sepaySandboxReference(orderNumber: string) {
  return `SEPAY-SANDBOX-${orderNumber}`;
}

export function sepayOrderDescription(orderNumber: string) {
  return `random.phitruong ${orderNumber}`;
}

export function isSePaySandboxMethod(paymentMethod: string) {
  return paymentMethod === "ONLINE_100_SEPAY";
}
