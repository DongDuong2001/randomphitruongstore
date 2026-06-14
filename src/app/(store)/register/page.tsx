import type { Metadata } from "next";
import Link from "next/link";
import { MockAuthForm } from "@/components/mock-auth-form";

export const metadata: Metadata = {
  title: "Customer register",
  description: "Frontend preview registration for customer checkout."
};

export default function RegisterPage() {
  return (
    <div className="paper-texture">
      <div className="container-shell grid min-h-[70vh] place-items-center py-14">
        <section className="w-full max-w-lg">
          <p className="eyebrow text-[#a72b1f]">Customer account</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.05em]">Đăng ký</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-600">
            Form đăng ký preview cho khách hàng. Dữ liệu hiện lưu localStorage và sẽ
            thay bằng backend auth sau.
          </p>
          <MockAuthForm
            mode="register"
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
          <Link
            className="mt-6 inline-block text-sm font-bold text-[#a72b1f] hover:text-black"
            href="/login"
          >
            Đã có tài khoản? Đăng nhập
          </Link>
        </section>
      </div>
    </div>
  );
}
