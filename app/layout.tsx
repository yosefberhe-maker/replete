import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Replete — Precision nutrition for GLP-1 users",
    template: "%s · Replete",
  },
  description:
    "GLP-1 is changing your body. Your nutrition plan hasn't kept up. Get a personalized deficiency profile, supplement stack, and meal framework in 2 minutes.",
  keywords: [
    "GLP-1 nutrition",
    "Ozempic deficiency",
    "Wegovy supplements",
    "Mounjaro vitamins",
    "Zepbound nutrition",
    "GLP-1 hair loss",
    "GLP-1 fatigue",
  ],
  openGraph: {
    title: "Replete — Precision nutrition for GLP-1 users",
    description:
      "88% of GLP-1 users are below optimal intake for 4+ key nutrients. Replete tells you exactly which ones.",
    url: siteUrl,
    siteName: "Replete",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Replete — Precision nutrition for GLP-1 users",
    description:
      "Personalized deficiency profile, supplement stack, and meal framework for GLP-1 users.",
  },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#080C14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-bg text-text font-sans flex min-h-dvh flex-col">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-border bg-bg/80 py-4 text-center text-xs text-muted">
          <div className="container-page">
            Replete provides general nutritional information based on published
            clinical research. This is not medical advice. Consult your
            healthcare provider before starting any supplement regimen.
          </div>
        </footer>
      </body>
    </html>
  );
}
