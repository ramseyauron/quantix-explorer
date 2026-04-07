'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface PendingTx {
  id: string
  sender: string
  receiver: string
  amount: string
  gas_limit: string
  gas_price: string
  nonce: number
  timestamp: number
  fee: string
}

function shortHash(h: string, front = 10, back = 6) {
  if (!h || h.length <= front + back + 3) return h
  return h.slice(0, front) + '…' + h.slice(-back)
}

function formatQTX(a: string) {
  try {
    const n = BigInt(a)
    if (n === 0n) return '0 QTX'
    const qtx = Number(n) / 1e18
    return qtx.toLocaleString('en-US', { maximumFractionDigits: 4 }) + ' QTX'
  } catch { return a }
}

function timeAgo(ts: number) {
  if (!ts || ts < 1_000_000) return '—'
  const s = Math.floor(Date.now() / 1000) - ts
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  return `${Math.floor(s/3600)}h ago`
}

export default function MempoolPage() {
  const [pending, setPending] = useState<PendingTx[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchMempool = useCallback(async () => {
    try {
      const res = await fetch('/api/node/mempool', { cache: 'no-store' })
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setPending(data.pending || [])
      setCount(data.count || 0)
      setLastUpdate(new Date())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchMempool()
    const interval = setInterval(fetchMempool, 5000)
    return () => clearInterval(interval)
  }, [fetchMempool])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-xs text-qtx-dim">
        <Link href="/" className="hover:text-qtx-cyan">Home</Link>
        <span>›</span>
        <span className="text-qtx-muted">Mempool</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Transaction Mempool</h1>
          <p className="text-qtx-dim text-sm mt-1">Pending transactions waiting to be included in a block</p>
        </div>
        {lastUpdate && (
          <span className="text-xs text-qtx-dim flex items-center gap-1.5">
            <span className="live-dot" />
            Live · {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="text-xs text-qtx-dim uppercase tracking-wide mb-2">Pending</div>
          <div className="text-2xl font-bold font-mono text-qtx-yellow">{count}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-qtx-dim uppercase tracking-wide mb-2">Refresh</div>
          <div className="text-2xl font-bold font-mono text-qtx-cyan">5s</div>
        </div>
        <div className="stat-card hidden sm:block">
          <div className="text-xs text-qtx-dim uppercase tracking-wide mb-2">Status</div>
          <div className="text-2xl font-bold font-mono text-qtx-green">{count > 0 ? 'Active' : 'Empty'}</div>
        </div>
      </div>

      {/* Table */}
      <div className="qtx-card overflow-hidden">
        <div className="px-4 py-3 border-b border-qtx-border bg-qtx-surface flex items-center justify-between">
          <h2 className="font-semibold text-qtx-text text-sm">
            {count} Pending Transaction{count !== 1 ? 's' : ''}
          </h2>
          <span className="text-xs text-qtx-dim">Auto-refreshes every 5s</span>
        </div>
        <div className="overflow-x-auto">
          <table className="qtx-table">
            <thead>
              <tr>
                <th>Tx Hash</th>
                <th className="hidden sm:table-cell">Age</th>
                <th className="hidden sm:table-cell">From</th>
                <th className="hidden sm:table-cell">To</th>
                <th>Value</th>
                <th className="hidden md:table-cell">Fee</th>
                <th className="hidden lg:table-cell">Nonce</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7}><div className="h-4 bg-qtx-surface2 rounded animate-pulse" /></td></tr>
                ))
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="text-qtx-dim text-sm">🎉 Mempool is empty — all transactions have been mined</div>
                  </td>
                </tr>
              ) : pending.map((tx, i) => (
                <tr key={tx.id || i}>
                  <td>
                    <Link href={`/tx/${encodeURIComponent(tx.id)}`} className="font-mono text-xs text-qtx-cyan hover:underline">
                      {shortHash(tx.id)}
                    </Link>
                  </td>
                  <td className="hidden sm:table-cell text-xs text-qtx-dim">{timeAgo(tx.timestamp)}</td>
                  <td className="hidden sm:table-cell">
                    <Link href={`/address/${tx.sender}`} className="font-mono text-xs text-qtx-muted hover:text-qtx-cyan">
                      {shortHash(tx.sender)}
                    </Link>
                  </td>
                  <td className="hidden sm:table-cell">
                    <Link href={`/address/${tx.receiver}`} className="font-mono text-xs text-qtx-muted hover:text-qtx-cyan">
                      {shortHash(tx.receiver)}
                    </Link>
                  </td>
                  <td><span className="font-mono text-xs text-qtx-green">{formatQTX(tx.amount)}</span></td>
                  <td className="hidden md:table-cell"><span className="font-mono text-xs text-qtx-dim">{formatQTX(tx.fee)}</span></td>
                  <td className="hidden lg:table-cell"><span className="font-mono text-xs text-qtx-dim">{tx.nonce}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="qtx-card p-5 text-sm text-qtx-muted space-y-2">
        <h3 className="text-white font-semibold text-sm">About the Mempool</h3>
        <p>The mempool (memory pool) holds unconfirmed transactions that have been submitted to the network but not yet included in a block. Transactions are removed from the mempool once they are committed to a PBFT-finalized block.</p>
        <p>Quantix uses a PBFT+PoS consensus — blocks are finalized within seconds, so mempool transactions are typically mined within 1–3 block times (8–24 seconds).</p>
      </div>
    </div>
  )
}
