import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import { BRAND, TAGLINE } from "@/lib/brand";
import { env } from "@/lib/env";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: { default: `${BRAND} – ${TAGLINE}`, template: `%s · ${BRAND}` },
  description:
    "RunWithMeClub is a friendly, structured running club: weekly group runs, coached training plans, monthly challenges and events for every pace.",
  applicationName: BRAND,
  openGraph: { type: "website", siteName: BRAND, locale: "en_IN" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f7f6f2" }, { media: "(prefers-color-scheme: dark)", color: "#0a0e13" }],
};

// Runs before paint so the saved theme applies without a flash.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-ink">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
