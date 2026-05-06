import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "TypeFlow | Typing Test",
  description: "Ứng dụng kiểm tra tốc độ gõ phím phong cách Glassmorphism.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={plusJakarta.variable} style={{ colorScheme: 'dark' }}>
      <body style={{
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        backgroundColor: '#0a0812',
        color: 'rgba(255,255,255,0.92)',
        fontFamily: 'var(--font-jakarta), Plus Jakarta Sans, system-ui, sans-serif',
      }}>
        {children}
      </body>
    </html>
  );
}
