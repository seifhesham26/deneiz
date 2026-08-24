import Link from "next/link";

export default function NotFound() {
  return (
    <div className="content-shell flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-semibold text-accent">404</p>
      <h1 className="text-2xl font-semibold">Page not found — الصفحة غير موجودة</h1>
      <Link href="/" className="text-sm text-accent hover:underline">
        ← Deneiz
      </Link>
    </div>
  );
}
