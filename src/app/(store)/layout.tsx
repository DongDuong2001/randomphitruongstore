import { FloatingZalo } from "@/components/floating-zalo";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CartProvider } from "@/components/cart-provider";
import { CurrencyProvider } from "@/components/currency-provider";
import { AuthProvider } from "@/context/auth-context";
import {
  getCurrencySettings,
  resolveRequestCurrency
} from "@/lib/currency-settings";

export default async function StoreLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const currencySettings = await getCurrencySettings();
  const currency = await resolveRequestCurrency(currencySettings);

  return (
    <AuthProvider>
      <CurrencyProvider
        initialCurrency={currency}
        initialSettings={currencySettings}
      >
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <FloatingZalo />
        </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
