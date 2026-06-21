"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

interface PaymentButtonsProps {
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentMethod?: string;
}

export function PaymentButtons({
  orderId,
  orderNumber,
  amount,
  paymentMethod
}: PaymentButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSePay = async () => {
    setLoading("sepay");
    try {
      const response = await fetch("/api/payment/sepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount,
          description: `Thanh toan don hang ${orderNumber}`
        })
      });

      const result = await response.json();
      if (result.success && result.data?.paymentUrl) {
        window.location.assign(result.data.paymentUrl);
      } else {
        alert(result.error ?? "Failed to initiate SePay payment");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600">Lưu ý: Đây là môi trường thử nghiệm.</p>
      
      <button
        onClick={handleSePay}
        disabled={!!loading}
        className="button-primary w-full flex items-center justify-center gap-2"
      >
        {loading === "sepay" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CreditCard className="size-4" />
        )}
        Thanh toán qua SePay
      </button>
    </div>
  );
}