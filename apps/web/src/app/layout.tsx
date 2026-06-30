import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YieldStream Treasury",
  description: "Soroban testnet yield stripping — SY vault, PT/YT market",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
