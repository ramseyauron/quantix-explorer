'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    if (/^\d+$/.test(q)) {
      router.push(`/block/${q}`)
    } else if (q.length > 20) {
      router.push(`/tx/${encodeURIComponent(q)}`)
    }
    setQuery('')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-qtx-border bg-qtx-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <polygon points="16,2 30,26 2,26" stroke="#00d4ff" strokeWidth="2" fill="none"/>
            <polygon points="16,8 25,24 7,24" fill="rgba(0,212,255,0.15)" stroke="#7b2fff" strokeWidth="1"/>
            <circle cx="16" cy="16" r="3" fill="#00d4ff"/>
          </svg>
          <span className="font-bold text-white tracking-wide">QUANTIX</span>
          <span className="text-xs text-slate-500 hidden sm:block">Explorer</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by block height, tx hash, address..."
            className="w-full bg-qtx-surface border border-qtx-border rounded-lg px-4 py-1.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-qtx-cyan transition-colors"
          />
        </form>

        <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-qtx-cyan transition-colors">Blocks</Link>
          <Link href="/txs" className="hover:text-qtx-cyan transition-colors">Txns</Link>
          <a href="https://github.com/ramseyauron/quantix" target="_blank" rel="noopener noreferrer"
             className="hover:text-qtx-cyan transition-colors">GitHub</a>
        </div>
      </div>
    </nav>
  )
}
