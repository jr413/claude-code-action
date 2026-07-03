import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav className="flex gap-4 border-b border-neutral-200 px-6 py-3 text-sm">
        <Link href="/admin/kyc">本人確認</Link>
        <Link href="/admin/shops">店舗</Link>
      </nav>
      {children}
    </div>
  );
}
