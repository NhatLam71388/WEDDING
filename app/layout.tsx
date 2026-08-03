import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thiệp cưới Ngô Nam & Nhật Mai",
  description:
    "Thiệp cưới và lời mời tham dự ngày vui của Ngô Nam và Nhật Mai.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
