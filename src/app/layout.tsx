import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Plainpage — Write clearly. Share simply.",
    template: "%s | Plainpage",
  },
  icons: {
    icon: "/brand/plainpage-icon.svg",
    apple: "/brand/plainpage-icon.svg",
  },
  description:
    "Write clearly. Share simply. Lightweight collaborative document editor for teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
