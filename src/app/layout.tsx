import './globals.css';
import { AuthProvider } from '../lib/auth';

export const metadata = {
  title: 'Vereinsshop',
  description: 'Bestellsystem für Vereinstextilien',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vereinsshop',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
