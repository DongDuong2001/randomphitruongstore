import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/mock-auth-form";

export const metadata: Metadata = {
  title: "Customer login",
  description: "Frontend preview login for customer checkout."
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Customer account"
      title="Đăng nhập"
      subtitle="Frontend preview để mô phỏng luồng mua hàng. Backend auth sẽ được nối sau."
      switchHref="/register"
      switchText="Chưa có tài khoản? Đăng ký"
    >
      <AuthForm
        mode="login"
        labels={{
          email: "Email",
          password: "Mật khẩu",
          fullName: "Họ và tên",
          invalidEmail: "Email chưa hợp lệ",
          passwordHint: "Mật khẩu tối thiểu 6 ký tự",
          loginAction: "Đăng nhập",
          registerAction: "Tạo tài khoản"
        }}
      />
    </AuthShell>
  );
}

function AuthShell({
  eyebrow,
  title,
  subtitle,
  switchHref,
  switchText,
  children
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  switchHref: string;
  switchText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="paper-texture">
      <div className="container-shell grid min-h-[70vh] place-items-center py-14">
        <section className="w-full max-w-lg">
          <p className="eyebrow text-[#a72b1f]">{eyebrow}</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.05em]">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-600">{subtitle}</p>
          {children}
          <Link
            className="mt-6 inline-block text-sm font-bold text-[#a72b1f] hover:text-black"
            href={switchHref}
          >
            {switchText}
          </Link>
        </section>
      </div>
    </div>
  );
}
