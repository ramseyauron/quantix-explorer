'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

function timeAgo(ts: number) {
  const s = Math.floor(Date.now() / 1000) - ts
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return new Date(ts * 1000).toLocaleString()
}

export default function BlockPage() {
  const { height } = useParams<{ height: string }>()
  const [block, setBlock] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/node/block/${height}`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setBlock)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [height])

  if (loading) return (
    <div className="space-y-3 animate-pulse">
      {[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-qtx-surface rounded-lg" />)}
    </div>
  )

  if (error || !block) return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-xl font-bold text-white mb-2">Block Not Found</h2>
      <p className="text-slate-500 mb-6">Block #{height} does not exist or node is offline.</p>
      <Link href="/" className="text-qtx-cyan hover:underline">← Back to Explorer</Link>
    </div>
  )

  const h = block.header
  const txs = block.body?.txs_list || []

  const fields = [
    { label: 'Block Height', value: `#${h.height}`, color: 'text-qtx-cyan', mono: true },
    { label: 'Status', value: '✅ Confirmed', color: 'text-qtx-green' },
    { label: 'Timestamp', value: `${new Date(h.timestamp * 1000).toLocaleString()} (${timeAgo(h.timestamp)})` },
    { label: 'Transactions', value: `${txs.length}` },
    { label: 'Version', value: String(h.version) },
    { label: 'Nonce', value: h.nonce, mono: true },
    { label: 'Gas Limit', value: h.gas_limit, mono: true },
    { label: 'Gas Used', value: h.gas_used, mono: true },
    { label: 'Block Hash', value: h.hash, mono: true, break: true },
    { label: 'Parent Hash', value: h.parent_hash, mono: true, break: true },
    { label: 'Txs Root', value: h.txs_root, mono: true, break: true },
    { label: 'State Root', value: h.state_root, mono: true, break: true },
    { label: 'Uncles Hash', value: h.uncles_hash, mono: true, break: true },
    { label: 'Extra Data', value: h.extra_data || '—' },
    { label: 'Proposer', value: h.proposer_id || h.miner || '—', mono: true, break: true },
    { label: 'Difficulty', value: h.difficulty, mono: true },
  ]

  function shortHash(s: string, n = 16) {
    if (!s) return '—'
    if (s.startsWith('GENESIS_')) return s.slice(0, 20) + '…'
    return s.slice(0, n) + '…' + s.slice(-8)
  }

  function formatQTX(a: string | number) {
    try {
      const n = BigInt(a.toString())
      if (n === 0n) return '0 QTX'
      const qtx = Number(n) / 1e18
      return qtx.toLocaleString('en-US', { maximumFractionDigits: 4 }) + ' QTX'
    } catch { return `${a}` }
  }

  const heightNum = parseInt(height)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-qtx-cyan">Home</Link>
        <span>›</span>
        <span className="text-slate-300">Block #{h.height}</span>
      </div>

      <div className="rounded-xl border border-qtx-border bg-qtx-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-qtx-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-qtx-cyan/10 border border-qtx-cyan/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Block #{h.height}</h1>
              <p className="text-xs text-slate-500">{timeAgo(h.timestamp)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {heightNum > 0 && (
              <Link href={`/block/${heightNum - 1}`}
                className="px-3 py-1.5 text-xs border border-qtx-border rounded-lg text-slate-400 hover:border-qtx-cyan hover:text-qtx-cyan transition-colors">
                ← Prev
              </Link>
            )}
            <Link href={`/block/${heightNum + 1}`}
              className="px-3 py-1.5 text-xs border border-qtx-border rounded-lg text-slate-400 hover:border-qtx-cyan hover:text-qtx-cyan transition-colors">
              Next →
            </Link>
          </div>
        </div>

        <div className="divide-y divide-qtx-border/40">
          {fields.map(({ label, value, mono, color, break: br }) => (
            <div key={label} className="px-6 py-3 flex flex-col sm:flex-row gap-1">
              <div className="sm:w-44 text-sm text-slate-500 shrink-0">{label}</div>
              <div className={`text-sm ${mono ? 'font-mono' : ''} ${color || 'text-slate-200'} ${br ? 'break-all' : ''}`}>
                {value || '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Transactions
          <span className="ml-2 px-2 py-0.5 rounded text-xs font-mono bg-qtx-cyan/10 text-qtx-cyan border border-qtx-cyan/20">{txs.length}</span>
        </h2>
        {txs.length === 0 ? (
          <div className="rounded-xl border border-qtx-border bg-qtx-surface p-8 text-center text-slate-600">No transactions in this block</div>
        ) : (
          <div className="rounded-xl border border-qtx-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-qtx-surface border-b border-qtx-border">
                  <th className="px-4 py-3 text-left text-slate-500 font-medium">Tx Hash</th>
                  <th className="px-4 py-3 text-left text-slate-500 font-medium hidden md:table-cell">From</th>
                  <th className="px-4 py-3 text-left text-slate-500 font-medium hidden md:table-cell">To</th>
                  <th className="px-4 py-3 text-left text-slate-500 font-medium">Amount</th>
                  <th className="px-4 py-3 text-left text-slate-500 font-medium hidden lg:table-cell">Nonce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-qtx-border/40">
                {txs.map((tx: any, i: number) => (
                  <tr key={`${tx.id}-${i}`} className="hover:bg-qtx-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/tx/${encodeURIComponent(tx.id)}`} className="font-mono text-xs text-qtx-cyan hover:underline">
                        {shortHash(tx.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-slate-400">{shortHash(tx.sender, 12)}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-slate-400">{shortHash(tx.receiver, 12)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-qtx-green">{formatQTX(tx.amount)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-slate-500">{tx.nonce}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
