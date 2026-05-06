import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TypeFlow — Nord × Amber",
  description: "Trải nghiệm luyện gõ phím tập trung cao độ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
