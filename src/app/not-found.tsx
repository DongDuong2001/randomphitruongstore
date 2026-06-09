import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-black p-5 text-white">
      <div className="text-center">
        <p className="eyebrow text-white/40">404</p>
        <h1 className="mt-4 text-5xl font-black">Page not found</h1>
        <Link
          className="button-primary mt-8 border-white bg-white text-black"
          href="/"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
