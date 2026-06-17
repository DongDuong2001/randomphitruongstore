import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AccountView } from "@/components/account-view";

export const metadata: Metadata = {
  title: "My Account",
  description: "View your orders and consultation requests."
};

export default async function AccountPage() {
  const t = await getTranslations("account");
  return <AccountView title={t("title")} />;
}