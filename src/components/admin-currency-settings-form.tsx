"use client";

import { Save } from "lucide-react";
import { useMemo, useState } from "react";
import {
  convertVndToUsd,
  formatMoney,
  type Currency,
  type CurrencySettings
} from "@/lib/currency";

export function AdminCurrencySettingsForm({
  initialSettings
}: {
  initialSettings: CurrencySettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>(
    initialSettings.defaultCurrency
  );
  const [usdEnabled, setUsdEnabled] = useState(initialSettings.usdEnabled);
  const [vndPerUsd, setVndPerUsd] = useState(
    initialSettings.vndPerUsd?.toString() ?? ""
  );
  const [previewVnd, setPreviewVnd] = useState("510000");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => {
    const amount = Number(previewVnd);
    const rate = Number(vndPerUsd);
    if (!Number.isFinite(amount) || amount < 0) {
      return null;
    }
    return {
      vnd: formatMoney(amount, "VND"),
      usd:
        usdEnabled && Number.isFinite(rate) && rate > 0
          ? formatMoney(convertVndToUsd(amount, rate), "USD")
          : null
    };
  }, [previewVnd, usdEnabled, vndPerUsd]);

  async function save() {
    setError("");
    setSaved("");
    setSaving(true);
    const body = {
      defaultCurrency: usdEnabled ? defaultCurrency : "VND",
      vndEnabled: true,
      usdEnabled,
      vndPerUsd: vndPerUsd ? Number(vndPerUsd) : null
    };

    try {
      const response = await fetch("/api/admin/currency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(formatApiError(result));
        return;
      }
      setSettings(result.data);
      setDefaultCurrency(result.data.defaultCurrency);
      setUsdEnabled(result.data.usdEnabled);
      setVndPerUsd(result.data.vndPerUsd?.toString() ?? "");
      setSaved("Saved");
    } catch {
      setError("Unable to save currency settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="border border-zinc-200 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <div className="grid gap-5">
          <label className="flex items-center justify-between gap-4 border border-zinc-200 p-4">
            <span>
              <span className="block text-sm font-black">VND</span>
              <span className="mt-1 block text-xs text-zinc-500">Vietnamese dong</span>
            </span>
            <input checked disabled className="size-5 accent-black" type="checkbox" />
          </label>

          <label className="flex items-center justify-between gap-4 border border-zinc-200 p-4">
            <span>
              <span className="block text-sm font-black">USD</span>
              <span className="mt-1 block text-xs text-zinc-500">US dollar display</span>
            </span>
            <input
              checked={usdEnabled}
              className="size-5 accent-black"
              onChange={(event) => {
                const checked = event.target.checked;
                setUsdEnabled(checked);
                if (!checked) setDefaultCurrency("VND");
              }}
              type="checkbox"
            />
          </label>

          <label>
            <span className="label">Default currency</span>
            <select
              className="field"
              onChange={(event) => setDefaultCurrency(event.target.value as Currency)}
              value={defaultCurrency}
            >
              <option value="VND">VND</option>
              {usdEnabled ? <option value="USD">USD</option> : null}
            </select>
          </label>

          <label>
            <span className="label">VND per USD</span>
            <input
              className="field"
              inputMode="decimal"
              min="0"
              onChange={(event) => setVndPerUsd(event.target.value)}
              placeholder="25500"
              step="0.0001"
              type="number"
              value={vndPerUsd}
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}
          {saved ? <p className="text-sm font-bold text-emerald-700">{saved}</p> : null}

          <button
            className="button-primary w-fit disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            onClick={save}
            type="button"
          >
            <Save size={16} />
            {saving ? "Saving" : "Save settings"}
          </button>
        </div>
      </section>

      <aside className="border border-zinc-200 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <h2 className="text-lg font-black">Preview</h2>
        <label className="mt-5 block">
          <span className="label">Example VND amount</span>
          <input
            className="field"
            inputMode="numeric"
            min="0"
            onChange={(event) => setPreviewVnd(event.target.value)}
            type="number"
            value={previewVnd}
          />
        </label>
        <dl className="mt-5 grid gap-3 border-t border-zinc-200 pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">VND</dt>
            <dd className="font-black">{preview?.vnd ?? "-"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">USD</dt>
            <dd className="font-black">{preview?.usd ?? "-"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Last updated</dt>
            <dd className="text-right font-bold">
              {settings.exchangeRateUpdatedAt
                ? new Date(settings.exchangeRateUpdatedAt).toLocaleString()
                : "Never"}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

function formatApiError(result: {
  error?: string;
  details?: Record<string, string[]>;
}) {
  const details = result.details
    ? Object.values(result.details).flat().join(" ")
    : "";
  return [result.error, details].filter(Boolean).join(": ") || "Unable to save";
}
