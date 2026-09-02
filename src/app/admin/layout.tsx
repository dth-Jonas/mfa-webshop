'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardHome = pathname === '/admin';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {!isDashboardHome && (
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm transition-all"
          >
            ← Zurück zum Dashboard
          </Link>
        </div>
      )}
      {children}
    </div>
  );
}
