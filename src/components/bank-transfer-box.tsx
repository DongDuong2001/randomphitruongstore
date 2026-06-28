import { Landmark } from "lucide-react";
import Image from "next/image";
import { BANK_DETAILS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";

export function BankTransferBox({
  title,
  instruction,
  amount,
  orderNumber
}: {
  title: string;
  instruction: string;
  amount?: number;
  orderNumber?: string;
}) {
  return (
    <div className="border border-black bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Landmark size={18} />
        <h3 className="font-bold">{title}</h3>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-zinc-500">Bank</dt>
          <dd className="mt-1 font-bold">{BANK_DETAILS.bank}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-zinc-500">
            Account number
          </dt>
          <dd className="mt-1 font-bold">{BANK_DETAILS.accountNumber}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-zinc-500">
            Account holder
          </dt>
          <dd className="mt-1 font-bold">{BANK_DETAILS.accountHolder}</dd>
        </div>
        {amount ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">
              Amount
            </dt>
            <dd className="mt-1 font-bold">{formatPrice(amount)}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-5 grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start">
        <div className="order-2 mx-auto flex w-full max-w-[300px] items-center justify-center border border-zinc-200 bg-white p-2 sm:order-1 sm:max-w-none">
          <Image
            src="https://qr.sepay.vn/img?bank=BIDV&acc=9624715031978&template=compact&showinfo=true&fullacc=true&holder=DO%20PHI%20TRUONG&store=randomphitruong"
            alt="QR thanh toán - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam - 2153102265 - DO PHI TRUONG"
            height={300}
            width={300}
            sizes="(min-width: 640px) 160px, min(300px, calc(100vw - 4rem))"
            className="h-auto w-full"
          />
        </div>
        <div className="order-1 text-sm leading-6 text-zinc-600 sm:order-2 sm:text-xs sm:leading-5">
          {orderNumber ? (
            <p className="mb-2 font-bold text-black">
              Transfer content: {orderNumber}
            </p>
          ) : null}
          <p>{instruction}</p>
        </div>
      </div>
    </div>
  );
}
