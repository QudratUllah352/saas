import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "SaaSpin | SaaS Deals, Reviews & Comparisons",
    template: "%s | SaaSpin",
  },

  description:
    "Discover SaaS deals, in-depth software reviews, product comparisons, and practical guides to help you explore SaaS tools.",

  applicationName: "SaaSpin",

  keywords: [
    "SaaS",
    "SaaS deals",
    "software deals",
    "software reviews",
    "SaaS reviews",
    "software comparisons",
    "SaaS tools",
  ],

  authors: [{ name: "SaaSpin" }],
  creator: "SaaSpin",
  publisher: "SaaSpin",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: "website",
    siteName: "SaaSpin",
    title: "SaaSpin | SaaS Deals, Reviews & Comparisons",
    description:
      "Discover SaaS deals, software reviews, product comparisons, and practical SaaS guides.",
  },

  twitter: {
    card: "summary_large_image",
    title: "SaaSpin | SaaS Deals, Reviews & Comparisons",
    description:
      "Discover SaaS deals, software reviews, product comparisons, and practical SaaS guides.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
