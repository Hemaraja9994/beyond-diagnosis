import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Backdrop } from "@/components/backdrop";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { programme } from "@/lib/programme";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${programme.title} · Yenepoya CRE`,
    template: `%s · ${programme.title}`,
  },
  description: programme.aim,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} antialiased`}>
        <Backdrop />
        <div className="relative z-10">
          <a className="skip" href="#content">
            Skip to content
          </a>
          <SiteHeader />
          <main id="content">{children}</main>
          <SiteFooter />
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
