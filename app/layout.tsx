import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Quantix Explorer',
  description: 'Blockchain explorer for Quantix — the post-quantum Layer 1 network',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-qtx-bg text-slate-100 min-h-screen font-sans antialiased">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-qtx-border mt-16 py-6 text-center text-slate-600 text-sm">
          <span className="text-qtx-cyan font-mono">QUANTIX</span> Explorer · Post-Quantum Blockchain · Chain ID 73310
        </footer>
      </body>
    </html>
  )
}
