import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { Suspense } from "react";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export { metadata } from "./metadata";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Informatics Template Lib",
  description:
    "Accelerate your competitive programming speed. Browse modular, optimized C++ algorithm templates, track upcoming Codeforces, AtCoder, LeetCode, & CodeChef contests, and sync feeds directly to your calendar.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://itl-hub.vercel.app",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: "Mohamed Ibrahim" },
  keywords:
    "competitive programming, cp templates, algorithms, data structures, code templates, contest calendar, codeforces contests, atcoder contests, leetcode contests, codechef contests",
  featureList: [
    "Curated CP template library",
    "Category-based template browsing",
    "One-click copy code snippets",
    "Fuzzy search across templates",
    "Competitive programming profiles",
    "Live contest calendar for Codeforces, AtCoder, LeetCode, and CodeChef",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${jetbrainsMono.variable} h-full antialiased dark`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-mono">
        <Providers>
          <Suspense>
            <NavBar />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        <Script id="structured-data" type="application/ld+json">
          {JSON.stringify(structuredData)}
        </Script>
        <Analytics />
      </body>
    </html>
  );
}
