'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface FlatTx {
  id: string
  sender: string
  receiver: string
  amount: string | number
  nonce: number
  gas_limit: string | number
  gas_price?: string | number
  blockHeight: number
  blockTimestamp: number
}

function shortHash(h: string, front = 10, back = 6) {
  if (!h) return '—'
  if (h.startsWith('GENESIS_')) return h.slice(0, 16) + '…'
  if (h.length <= front + back + 3) return h
  return h.slice(0, front) + '…' + h.slice(-back)
}

function formatQTX(a: string | number) {
  try {
    const n = BigInt(a.toString())
    if (n === 0n) return '0 QTX'
    const qtx = Number(n) / 1e18
    return qtx < 0.000001 ? `${n} nQTX` : qtx.toLocaleString('en-US', { maximumFractionDigits: 6 }) + ' QTX'
  } catch { return `${a}` }
}

function formatFee(gasLimit: string | number, gasPrice?: string | number) {
  if (!gasPrice) return '—'
  try {
    const fee = BigInt(gasLimit.toString()) * BigInt(gasPrice.toString())
    const qtx = Number(fee) / 1e18
    return qtx < 0.000001 ? `${fee} nQTX` : qtx.toLocaleString('en-US', { maximumFractionDigits: 8 }) + ' QTX'
  } catch { return '—' }
}

function timeAgo(ts: number) {
  if (!ts) return '—'
  const s = Math.floor(Date.now() / 1000) - ts
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const PAGE_SIZE = 25

export default function TxsPage() {
  const [txs, setTxs] = useState<FlatTx[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      try {
        const countRes = await fetch('/api/node/blockcount', { cache: 'no-store' })
        const { count } = await countRes.json()
        const blockPromises = Array.from({ length: count }, (_, i) =>
          fetch(`/api/node/block/${i}`, { cache: 'no-store' }).then(r => r.json()).catch(() => null)
        )
        const blocks = (await Promise.all(blockPromises)).filter(Boolean)
        const allTxs: FlatTx[] = blocks.flatMap((b: any) =>
          (b.body?.txs_list || []).map((tx: any) => ({
            ...tx,
            blockHeight: b.header.height,
            blockTimestamp: b.header.timestamp,
          }))
        )
        setTxs(allTxs.reverse())
      } catch { /* offline */ }
      setLoading(false)
    }
    load()
    const iv = setInterval(load, 10000)
    return () => clearInterval(iv)
  }, [])

  const totalPages = Math.max(1, Math.ceil(txs.length / PAGE_SIZE))
  const pageTxs = txs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pageNumbers = () => {
    const pages: number[] = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-qtx-dim mb-2">
            <Link href="/" className="hover:text-qtx-cyan">Home</Link>
            <span>›</span>
            <span className="text-qtx-muted">Transactions</span>
          </div>
          <h1 className="text-xl font-bold text-white">Transactions</h1>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-qtx-dim">
          <span className="live-dot" />
          Live · refreshes 10s
        </span>
      </div>

      {/* Summary */}
      <div className="text-xs text-qtx-dim">
        {loading ? 'Loading…' : (
          <>
            A total of <span className="text-qtx-text font-medium">{txs.length.toLocaleString()}</span> transactions found
            {txs.length > 0 && ` (showing ${((page - 1) * PAGE_SIZE + 1).toLocaleString()}–${Math.min(page * PAGE_SIZE, txs.length).toLocaleString()})`}
          </>
        )}
      </div>

      {/* Table */}
      <div className="qtx-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="qtx-table">
            <thead>
              <tr>
                <th>Tx Hash</th>
                <th className="hidden sm:table-cell">Block</th>
                <th className="hidden md:table-cell">Age</th>
                <th>From</th>
                <th className="hidden md:table-cell">To</th>
                <th>Value</th>
                <th className="hidden lg:table-cell">Tx Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(PAGE_SIZE)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8}>
                      <div className="h-4 bg-qtx-surface2 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : txs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-qtx-dim text-sm">
                    No transactions found. The blockchain may be empty.
                  </td>
                </tr>
              ) : pageTxs.map((tx, i) => (
                <tr key={`${tx.id}-${i}`}>
                  <td>
                    <Link href={`/tx/${encodeURIComponent(tx.id)}`} className="font-mono text-xs text-qtx-cyan hover:underline">
                      {shortHash(tx.id)}
                    </Link>
                  </td>
                  <td className="hidden sm:table-cell">
                    <Link href={`/block/${tx.blockHeight}`} className="font-mono text-xs text-qtx-muted hover:text-qtx-cyan">
                      #{tx.blockHeight}
                    </Link>
                  </td>
                  <td className="hidden md:table-cell text-xs text-qtx-dim">
                    {timeAgo(tx.blockTimestamp)}
                  </td>
                  <td>
                    <Link href={`/address/${tx.sender}`} className="font-mono text-xs text-qtx-muted hover:text-qtx-cyan">
                      {shortHash(tx.sender, 8, 6)}
                    </Link>
                  </td>
                  <td className="hidden md:table-cell">
                    <Link href={`/address/${tx.receiver}`} className="font-mono text-xs text-qtx-muted hover:text-qtx-cyan">
                      {shortHash(tx.receiver, 8, 6)}
                    </Link>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-qtx-green">{formatQTX(tx.amount)}</span>
                  </td>
                  <td className="hidden lg:table-cell">
                    <span className="font-mono text-xs text-qtx-dim">{formatFee(tx.gas_limit, tx.gas_price)}</span>
                  </td>
                  <td>
                    <span className="badge badge-success">Success</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-qtx-dim">
            Page {page} of {totalPages.toLocaleString()}
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="page-btn"
            >«</button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="page-btn"
            >‹</button>
            {pageNumbers().map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`page-btn ${n === page ? 'active' : ''}`}
              >{n}</button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="page-btn"
            >›</button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="page-btn"
            >»</button>
          </div>
        </div>
      )}
    </div>
  )
}
