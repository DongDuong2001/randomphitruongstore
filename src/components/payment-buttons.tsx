"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { navigateToPayment } from "@/lib/payment-navigation";

interface PaymentButtonsProps {
  orderId: string;
  labels: {
    pay: string;
    error: string;
    genericError: string;
  };
}

export function PaymentButtons({
  orderId,
  labels
}: PaymentButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSePay = async () => {
    setLoading("sepay");
    try {
      const response = await fetch("/api/payment/sepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId
        })
      });

      const result = await response.json();
      if (result.success && navigateToPayment(result.data)) {
      } else {
        alert(result.error ?? labels.error);
      }
    } catch (error) {
      console.error("SePay payment initiation failed", {
        name: error instanceof Error ? error.name : typeof error
      });
      alert(labels.genericError);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
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
        {labels.pay}
      </button>
      {loading === "sepay" && (
        <p className="text-[10px] text-amber-600 font-bold text-center mt-1 animate-pulse">
          Vui lòng đợi một chút để QR thanh toán hiện lên... / Please wait a moment for the payment QR code to appear...
        </p>
      )}
    </div>
  );
}
