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
  title: "crosscrafted — Grow in Faith, Together",
  description:
    "Your all-in-one Christian community platform — Bible trivia, apologetics, church directory, marketplace, and more. Built to strengthen faith and connect believers across India.",
  keywords: [
    "CrossCrafted",
    "Christian community",
    "Bible trivia",
    "church directory India",
    "apologetics",
    "prayer wall",
    "Christian marketplace",
  ],
  authors: [{ name: "CrossCrafted Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "crosscrafted — Grow in Faith, Together",
    description:
      "Your all-in-one Christian community platform — Bible trivia, apologetics, church directory, marketplace, and more.",
    siteName: "crosscrafted",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "crosscrafted",
    description: "Grow in Faith, Together",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} antialiased bg-[#12101A] text-white`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
        <SonnerToaster position="top-center" />
      </body>
    </html>
  );
}
