/**
 * frontend/app/layout.tsx
 * ------------------------
 * Root layout — wraps every page.
 * Sets the document metadata and loads the Inter font.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Identity Document Screening System",
  description:
    "AI-assisted identity document screening prototype — OCR, tampering detection, face verification, and risk scoring. Hackathon demo only.",
  keywords: ["AI", "document screening", "OCR", "face verification", "hackathon"],
  authors: [{ name: "Team HACK-A-THRONE 2026" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="relative z-10">
        {children}
      </body>
    </html>
  );
}
