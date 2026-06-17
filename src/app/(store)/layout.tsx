import { FloatingZalo } from "@/components/floating-zalo";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CartProvider } from "@/components/cart-provider";
import { AuthProvider } from "@/context/auth-context";

export default function StoreLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      <CartProvider>
        <Header />
        <main>{children}</main>
        <Footer />
        <FloatingZalo />
      </CartProvider>
    </AuthProvider>
  );
}
