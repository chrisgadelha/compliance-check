import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ComplianceCheck",
  description: "Heuristic risk check for Celo wallet addresses — built for MiniPay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* viewport keeps the layout correct on 360px-wide budget Android phones */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
