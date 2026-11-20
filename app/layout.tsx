import type { Metadata } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { programme } from "@/lib/programme";
import "./globals.css";

const source = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
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
      <body className={`${source.variable} ${newsreader.variable} antialiased`}>
        <a className="skip" href="#content">
          Skip to content
        </a>
        <SiteHeader />
        <main id="content">{children}</main>
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
