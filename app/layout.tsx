import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Quantix Explorer',
  description: 'Blockchain explorer for Quantix — the post-quantum Layer 1 network',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-qtx-bg text-qtx-text min-h-screen antialiased" style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
        <footer className="border-t border-qtx-border mt-12 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-qtx-dim">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                  <polygon points="16,2 30,26 2,26" stroke="#06b6d4" strokeWidth="2" fill="none"/>
                  <circle cx="16" cy="17" r="3" fill="#06b6d4"/>
                </svg>
                <span className="font-semibold text-qtx-muted">Quantix Explorer</span>
              </div>
              <div className="text-center text-qtx-dim">
                Quantix Devnet · Chain ID 73310 · Post-Quantum Layer 1 · SPHINCS+ Signatures
              </div>
              <div className="flex items-center gap-3 text-qtx-dim">
                <a href="https://github.com" className="hover:text-qtx-cyan transition-colors">GitHub</a>
                <span>·</span>
                <a href="https://qpqb.org/whitepaper" className="hover:text-qtx-cyan transition-colors">Whitepaper</a>
                <span>·</span>
                <span>© 2026 Quantix Network</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
