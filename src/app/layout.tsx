import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Ajaia Docs', template: '%s | Ajaia Docs' },
  description: 'Lightweight collaborative document editor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
