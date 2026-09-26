import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { themeBootScript, themeColorScript } from "@/lib/theme-boot";
import { site } from "@/lib/site";

const canonical = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ajan-atolyesi.dev";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL(canonical),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.claim,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: canonical,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.claim,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.claim,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* theme-color: renk literal'i değil — `themeColorScript` `--bg` token'ından üretir. */
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${jetbrains.variable} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <a
          href="#icerik"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-fg"
        >
          İçeriğe geç
        </a>
        <SiteHeader />
        <main id="icerik">{children}</main>
        <SiteFooter />
        <script dangerouslySetInnerHTML={{ __html: themeColorScript }} />
      </body>
    </html>
  );
}
