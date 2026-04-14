import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f2f5" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "منصة المتابعة | AlMosawa Platform",
  description: "المنصة الذكية لمتابعة حلقات الحفظ والمراجعة - روضة الحافظين",
  icons: {
    icon: "/images/logo/logo.png",
    apple: "/images/logo/logo.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full min-h-[100dvh] flex flex-col">{children}</body>
    </html>
  );
}
