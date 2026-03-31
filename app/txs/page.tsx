'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Tx {
  id: string
  sender: string
  receiver: string
  amount: string | number
  nonce: number
  gas_limit: string | number
  blockHeight?: number
  blockTimestamp?: number
}

function shortHash(h: string, n = 12) {
  if (!h) return '—'
  if (h.startsWith('GENESIS_')) return h.slice(0, 16) + '…'
  return h.slice(0, n) + '…' + h.slice(-6)
}

function formatQTX(a: string | number) {
  try {
    const n = BigInt(a.toString())
    if (n === 0n) return '0 QTX'
    const qtx = Number(n) / 1e18
    return qtx < 0.0001 ? `${n} nQTX` : qtx.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' QTX'
  } catch { return `${a}` }
}

function timeAgo(ts: number) {
  if (!ts) return '—'
  const s = Math.floor(Date.now() / 1000) - ts
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export default function TxsPage() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const countRes = await fetch('/api/node/blockcount', { cache: 'no-store' })
        const { count } = await countRes.json()
        const blockPromises = Array.from({ length: count }, (_, i) =>
          fetch(`/api/node/block/${i}`, { cache: 'no-store' }).then(r => r.json()).catch(() => null)
        )
        const blocks = (await Promise.all(blockPromises)).filter(Boolean)
        const allTxs = blocks.flatMap((b: any) =>
          (b.body?.txs_list || []).map((tx: Tx) => ({
            ...tx,
            blockHeight: b.header.height,
            blockTimestamp: b.header.timestamp,
          }))
        )
        setTxs(allTxs)
      } catch { /* offline */ }
      setLoading(false)
    }
    load()
    const iv = setInterval(load, 10000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">{txs.length} transactions</p>
        </div>
        <span className="text-xs text-qtx-green flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-qtx-green blink inline-block" /> Live
        </span>
      </div>
      <div className="rounded-xl border border-qtx-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-qtx-surface border-b border-qtx-border">
              <th className="px-4 py-3 text-left text-slate-500 font-medium">Tx Hash</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium hidden sm:table-cell">Block</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium hidden md:table-cell">Age</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium">From</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium hidden md:table-cell">To</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-qtx-border/40">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3">
                  <div className="h-4 bg-qtx-surface rounded animate-pulse" />
                </td></tr>
              ))
            ) : txs.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-600">
                No transactions yet. Send some via the node API.
              </td></tr>
            ) : txs.map((tx, i) => (
              <tr key={`${tx.id}-${i}`} className="hover:bg-qtx-surface/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/tx/${encodeURIComponent(tx.id)}`} className="font-mono text-xs text-qtx-cyan hover:underline">
                    {shortHash(tx.id)}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <Link href={`/block/${tx.blockHeight}`} className="text-xs text-slate-400 hover:text-qtx-cyan">
                    #{tx.blockHeight}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">
                  {timeAgo(tx.blockTimestamp || 0)}
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-slate-400">{shortHash(tx.sender, 10)}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="font-mono text-xs text-slate-400">{shortHash(tx.receiver, 10)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-qtx-green">{formatQTX(tx.amount)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
