import type { Metadata } from 'next'
import { Orbitron, Exo_2 } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
})

const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-exo2',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Quantix Explorer',
  description: 'Blockchain explorer for Quantix — the post-quantum Layer 1 network',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${exo2.variable}`}>
      <body className="bg-qtx-bg text-qtx-text min-h-screen font-body antialiased">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-qtx-border mt-16 py-6 text-center text-slate-600 text-sm font-body">
          <span className="text-qtx-cyan font-mono font-bold tracking-widest" style={{ fontFamily: 'var(--font-orbitron)', textShadow: '0 0 10px rgba(0,255,255,0.4)' }}>QUANTIX</span>
          <span className="text-slate-600"> Explorer · Post-Quantum Blockchain · Chain ID 73310</span>
        </footer>
      </body>
    </html>
  )
}
