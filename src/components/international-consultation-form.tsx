"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ZALO_URL } from "@/lib/constants";
import { ZaloIcon } from "./brand-icons";

const REGION_OPTIONS = [
  { value: "KOREA", label: "Korea 🇰🇷" },
  { value: "TAIWAN", label: "Taiwan 🇹🇼" },
  { value: "JAPAN", label: "Japan 🇯🇵" }
] as const;

const schema = z.object({
  fullName: z.string().trim().min(2, "Required"),
  phone: z.string().trim().min(9, "Required"),
  socialContact: z.string().trim().min(2, "Required"),
  productName: z.string().trim().min(2, "Required"),
  region: z.enum(["KOREA", "TAIWAN", "JAPAN"]),
  desiredSize: z.string().trim().min(1, "Required"),
  desiredColor: z.string().trim().min(1, "Required"),
  customsNote: z.string().trim().optional(),
  note: z.string().trim().max(1000).optional()
});

type FormValues = z.infer<typeof schema>;

type SuccessResult = {
  zaloUrl: string;
};

export function InternationalConsultationForm({
  labels,
  prefill
}: {
  labels: Record<string, string>;
  prefill?: {
    product?: string;
    size?: string;
    color?: string;
    region?: string;
  };
}) {
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState<SuccessResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      productName: prefill?.product ?? "",
      desiredSize: prefill?.size ?? "",
      desiredColor: prefill?.color ?? "",
      region:
        (["KOREA", "TAIWAN", "JAPAN"].includes(prefill?.region ?? "")
          ? prefill?.region
          : "KOREA") as FormValues["region"]
    }
  });

  async function onSubmit(values: FormValues) {
    setServerError("");

    const res = await fetch("/api/international-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      setServerError(json.error ?? "Unable to submit request");
      return;
    }

    // Build a pre-filled Zalo message with the consultation details.
    const zaloMessage = buildZaloMessage(values);
    setResult({ zaloUrl: `${ZALO_URL}?text=${encodeURIComponent(zaloMessage)}` });
  }

  if (result) {
    return (
      <div className="max-w-2xl border border-black bg-white p-8">
        <p className="eyebrow text-[#a72b1f]">{labels.success}</p>
        <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600">
          {labels.successBody}
        </p>
        <a
          className="button-primary mt-6"
          href={result.zaloUrl}
          rel="noreferrer"
          target="_blank"
        >
          <ZaloIcon size={17} />
          {labels.zaloButton}
        </a>
      </div>
    );
  }

  return (
    <form
      className="grid max-w-2xl gap-5 border border-zinc-300 bg-white p-5 sm:grid-cols-2 xl:grid-cols-2 sm:p-8"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField
        error={errors.fullName?.message}
        label={labels.fullName}
        registration={register("fullName")}
      />
      <FormField
        error={errors.phone?.message}
        label={labels.phone}
        registration={register("phone")}
        type="tel"
      />
      <FormField
        error={errors.socialContact?.message}
        label={labels.social}
        registration={register("socialContact")}
      />
      <div>
        <label className="label block">{labels.region}</label>
        <select className="field" {...register("region")}>
          {REGION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.region ? (
          <span className="error-text">{errors.region.message}</span>
        ) : null}
      </div>
      <div className="sm:col-span-2">
        <FormField
          error={errors.productName?.message}
          label={labels.productName}
          registration={register("productName")}
        />
      </div>
      <FormField
        error={errors.desiredSize?.message}
        label={labels.size}
        registration={register("desiredSize")}
      />
      <FormField
        error={errors.desiredColor?.message}
        label={labels.color}
        registration={register("desiredColor")}
      />
      <div className="sm:col-span-2">
        <FormField
          error={errors.customsNote?.message}
          label={labels.customsNote}
          registration={register("customsNote")}
        />
      </div>
      <label className="sm:col-span-2">
        <span className="label">{labels.note}</span>
        <textarea className="field min-h-24" {...register("note")} />
      </label>
      {serverError ? (
        <p className="error-text sm:col-span-2">{serverError}</p>
      ) : null}
      <button
        className="button-primary sm:col-span-2 sm:justify-self-start"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? labels.loading : labels.submit}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

function buildZaloMessage(values: FormValues): string {
  const regionLabels: Record<string, string> = {
    KOREA: "Hàn Quốc 🇰🇷",
    TAIWAN: "Đài Loan 🇹🇼",
    JAPAN: "Nhật Bản 🇯🇵"
  };
  const lines = [
    `[Đơn quốc tế - ${regionLabels[values.region] ?? values.region}]`,
    `Tên: ${values.fullName}`,
    `SĐT: ${values.phone}`,
    `Mạng xã hội: ${values.socialContact}`,
    `Sản phẩm: ${values.productName}`,
    `Size: ${values.desiredSize} | Màu: ${values.desiredColor}`,
    values.customsNote ? `Hải quan: ${values.customsNote}` : null,
    values.note ? `Ghi chú: ${values.note}` : null
  ].filter(Boolean);
  return lines.join("\n");
}

function FormField({
  label,
  error,
  registration,
  type = "text"
}: {
  label: string;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm<FormValues>>["register"]>;
  type?: string;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <input className="field" type={type} {...registration} />
      {error ? <span className="error-text">{error}</span> : null}
    </label>
  );
}
