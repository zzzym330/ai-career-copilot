import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "职觉 JobPulse",
  description: "解译职业脉动",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
