import type { Metadata } from "next";

const description =
  "Accelerate your competitive programming speed. Browse modular, optimized C++ algorithm templates, track upcoming Codeforces, AtCoder, LeetCode, & CodeChef contests, and sync feeds directly to your calendar.";

export const metadata: Metadata = {
  title: {
    default: "Informatics Template Lib | Ultimate Competitive Programming Library & Contest Sync",
    template: "%s | Informatics Template Lib",
  },
  description,
  keywords: [
    "competitive programming",
    "cp templates",
    "algorithms",
    "data structures",
    "code templates",
    "contest",
    "contest calendar",
    "upcoming contests",
    "cp",
    "icpc",
    "codeforces",
    "codeforces contests",
    "atcoder",
    "atcoder contests",
    "leetcode",
    "leetcode contests",
    "codechef",
    "codechef contests",
    "competitive programming calendar",
    "segment tree",
    "graph algorithms",
    "dynamic programming",
    "binary search",
    "number theory",
    "combinatorics",
    "string algorithms",
    "geometry algorithms",
    "range queries",
    "bit manipulation",
    "fenwick tree",
    "disjoint set union",
    "trie",
    "kmp",
    "dijkstra",
    "sieve",
    "matrix exponentiation",
    "sparse table",
    "convex hull trick",
    "modular arithmetic",
    "cpp templates",
    "contest programming",
    "algorithm library",
    "coding templates",
  ],
  authors: [{ name: "Mohamed Ibrahim", url: "https://mohamediibrahim.dev" }],
  creator: "Mohamed Ibrahim",
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "32x32" }],
    shortcut: "/icon",
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://itl-hub.vercel.app"),
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Informatics Template Lib",
    title: "Informatics Template Lib | Ultimate Competitive Programming Library & Contest Sync",
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Informatics Template Lib | Ultimate Competitive Programming Library & Contest Sync",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Informatics Template Lib | Ultimate Competitive Programming Library & Contest Sync",
    description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};
