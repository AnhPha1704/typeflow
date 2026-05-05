import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";

const vt323 = VT323({
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
  variable: "--font-vt323",
});

export const metadata: Metadata = {
  title: "TypeFlow | Pixel Art Typing Test",
  description: "Ứng dụng kiểm tra tốc độ gõ phím phong cách Pixel Art sử dụng dữ liệu từ Wikipedia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${vt323.variable} antialiased`} style={{ colorScheme: 'dark' }}>
      <body className="font-pixel bg-background text-foreground selection:bg-primary selection:text-white">{children}</body>
    </html>
  );
}
