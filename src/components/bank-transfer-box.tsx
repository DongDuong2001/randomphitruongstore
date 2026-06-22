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
    <div className="border border-black bg-white p-5">
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
      <div className="mt-5 grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="flex aspect-square items-center justify-center border border-zinc-200 bg-white">
          <Image
            src="https://qr.sepay.vn/img?bank=BIDV&acc=9624715031978&template=compact&showinfo=true&fullacc=true&holder=DO%20PHI%20TRUONG&store=randomphitruong"
            alt="QR thanh toán - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam - 2153102265 - DO PHI TRUONG"
            height={300}
            width={300}
            className="mx-auto"
          />
        </div>
        <div className="text-xs leading-5 text-zinc-600">
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
