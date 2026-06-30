import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YieldStream — Automated Yield Stripping on Stellar",
  description:
    "Deposit USDC into a fixed-rate SY vault on Soroban, strip into PT and YT, and let keeper automation handle the rest.",
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
