import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpsPilot — AI-Powered Business Operations Platform',
  description:
    'Production-grade SaaS operations platform with role-based customer, product, and ticket management powered by AI triaging.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
