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
        <meta name="talentapp:project_verification" content="b916b75a380ce9fcd5d574c6057a9a08c06b9d9eeafbd1ec01836c7b3e16129d9b1a455d5c9834d3043e4e4234708227e44b2067a" />
      </head>
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
