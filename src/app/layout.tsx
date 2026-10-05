import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/crosscrafted/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://crosscraftedapp.vercel.app"
      : "http://localhost:3000")
  ),
  title: "Believ — Believe. Connect. Grow.",
  description:
    "Your all-in-one Christian community platform — Bible trivia, apologetics, church directory, marketplace, and more. Built to strengthen faith and connect believers across India.",
  keywords: [
    "Believ",
    "Christian community",
    "Bible trivia",
    "church directory India",
    "apologetics",
    "prayer wall",
    "Christian marketplace",
  ],
  authors: [{ name: "Believ Team" }],
  icons: {
    icon: "/believ-logo.png",
    apple: "/believ-logo.png",
  },
  openGraph: {
    title: "Believ — Believe. Connect. Grow.",
    description:
      "Your all-in-one Christian community platform — Bible trivia, apologetics, church directory, marketplace, and more.",
    siteName: "Believ",
    type: "website",
    images: ["/believ-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Believ",
    description: "Believe. Connect. Grow.",
    images: ["/believ-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="geist_a71539c9-module__T19VSG__variable antialiased bg-[#12101A] text-white">
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
