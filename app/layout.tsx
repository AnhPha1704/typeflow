import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TypeFlow — Luyện gõ phím",
  description: "Luyện gõ phím với văn bản Wikipedia theo nhiều ngôn ngữ. Sage Forest theme.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
