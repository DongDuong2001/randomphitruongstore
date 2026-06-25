import { AdminCurrencySettingsForm } from "@/components/admin-currency-settings-form";
import { getCurrencySettings } from "@/lib/currency-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const currencySettings = await getCurrencySettings();

  return (
    <>
      <header>
        <p className="eyebrow text-zinc-500">Store configuration</p>
        <h1 className="mt-2 text-4xl font-black">Settings</h1>
      </header>
      <AdminCurrencySettingsForm initialSettings={currencySettings} />
    </>
  );
}
