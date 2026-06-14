import { FloatingZalo } from "@/components/floating-zalo";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CartProvider } from "@/components/cart-provider";

export default function StoreLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <Header />
      <main>{children}</main>
      <Footer />
      <FloatingZalo />
    </CartProvider>
  );
}
