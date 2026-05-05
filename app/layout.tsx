import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";

const robotoMono = Roboto_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "TypeFlow | Kiểm tra tốc độ gõ phím chuyên nghiệp",
  description: "Ứng dụng kiểm tra tốc độ gõ phím đa ngôn ngữ sử dụng dữ liệu từ Wikipedia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${robotoMono.variable} antialiased`}>
      <body className="font-mono">{children}</body>
    </html>
  );
}
