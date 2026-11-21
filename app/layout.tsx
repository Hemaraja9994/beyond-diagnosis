import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Backdrop } from "@/components/backdrop";
import { BottomNav } from "@/components/bottom-nav";
import { ServiceWorker } from "@/components/service-worker";
import { ScrollTicks } from "@/components/scroll-ticks";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { programme } from "@/lib/programme";
import "./globals.css";

const outfit = localFont({
  src: "./fonts/outfit-latin-wght-normal.woff2",
  variable: "--font-outfit",
  weight: "100 900",
  display: "swap",
});

const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces-latin-full-normal.woff2", style: "normal", weight: "100 900" },
    { path: "./fonts/fraunces-latin-full-italic.woff2", style: "italic", weight: "100 900" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

const oswald = localFont({
  src: "./fonts/oswald-latin-wght-normal.woff2",
  variable: "--font-oswald",
  weight: "200 700",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0b1f3a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: `${programme.title} · Yenepoya CRE`,
    template: `%s · ${programme.title}`,
  },
  description: programme.aim,
  applicationName: programme.title,
  appleWebApp: {
    capable: true,
    title: "Beyond Diagnosis",
    statusBarStyle: "black",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} ${oswald.variable}`}>
      <body className="antialiased">
        <ServiceWorker />
        <Backdrop />
        <div className="relative z-10">
          <a className="skip" href="#content">
            Skip to content
          </a>
          <SiteHeader />
          <main id="content">{children}</main>
          <SiteFooter />
          <BottomNav />
          <ScrollTicks />
        </div>
      </body>
    </html>
  );
}
