import type { Metadata, Viewport } from 'next'
import { Heebo } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { PwaRegister } from '@/components/pwa-register'
import { PwaInstallBanner } from '@/components/pwa-install-banner'
import './globals.css'

const heebo = Heebo({ 
  subsets: ["hebrew", "latin"],
  variable: '--font-heebo'
});

export const metadata: Metadata = {
  title: 'AssetMap Pro | Grid & Drag',
  description: 'מערכת ניהול נכסים ועמדות עבודה',
  generator: 'v0.app',
  themeColor: '#00f2ff',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/entrance-icon.png',
    apple: '/entrance-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans antialiased`}>
        <div className="min-h-screen flex flex-col bg-[var(--bg-dark)]">
          <div className="flex-1">
            {children}
          </div>
          <footer className="w-full border-t border-[var(--glass-border)] bg-gradient-to-l from-black/40 via-card/80 to-black/40 backdrop-blur-sm px-4 py-3">
            <div className="max-w-5xl mx-auto flex flex-col items-center justify-center gap-1 text-[11px] sm:text-xs text-muted-foreground text-center">
              <span>
                פותח ע״י{" "}
                <span className="font-semibold text-[var(--primary)]">
                  תקשוב של מטה (שלינקה)
                </span>{" "}
                ו{" "}
                <span className="font-semibold text-[var(--primary)]">
                  תקשוב של מעלה (ניהול הידע)
                </span>{" "}
                ברבנות הצבאית
              </span>
            </div>
          </footer>
        </div>
        <PwaRegister />
        <PwaInstallBanner />
        <Analytics />
      </body>
    </html>
  )
}
