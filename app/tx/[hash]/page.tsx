'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

function shortHash(h: string, front = 10, back = 8) {
  if (!h) return '—'
  if (h.startsWith('GENESIS_')) return h.slice(0, 18) + '…'
  if (h.length <= front + back + 3) return h
  return h.slice(0, front) + '…' + h.slice(-back)
}

function formatQTX(a: string | number) {
  try {
    const n = BigInt(a.toString())
    if (n === 0n) return '0 QTX'
    const qtx = Number(n) / 1e18
    return qtx.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 6 }) + ' QTX'
  } catch { return `${a}` }
}

function formatFee(gasLimit: string | number, gasPrice: string | number) {
  try {
    const fee = BigInt(gasLimit.toString()) * BigInt(gasPrice.toString())
    if (fee === 0n) return '0 nQTX'
    const qtx = Number(fee) / 1e18
    if (qtx < 0.000001) return `${fee.toLocaleString()} nQTX`
    return qtx.toLocaleString('en-US', { maximumFractionDigits: 8 }) + ' QTX'
  } catch { return '—' }
}

function timeAgo(ts: number) {
  const s = Math.floor(Date.now() / 1000) - ts
  if (s < 60) return `${s} secs ago`
  if (s < 3600) return `${Math.floor(s / 60)} mins ago`
  return new Date(ts * 1000).toUTCString()
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="detail-row">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{children}</div>
    </div>
  )
}

export default function TxPage() {
  const { hash } = useParams<{ hash: string }>()
  const txHash = decodeURIComponent(hash)
  const [tx, setTx] = useState<any>(null)
  const [blockInfo, setBlockInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const countRes = await fetch('/api/node/blockcount', { cache: 'no-store' })
        const { count } = await countRes.json()

        // Search blocks from newest to oldest
        for (let i = count - 1; i >= 0; i--) {
          const res = await fetch(`/api/node/block/${i}`, { cache: 'no-store' })
          if (!res.ok) continue
          const block = await res.json()
          const found = (block.body?.txs_list || []).find((t: any) => t.id === txHash)
          if (found) {
            setTx(found)
            setBlockInfo(block)
            setLoading(false)
            return
          }
        }
        setError(true)
      } catch {
        setError(true)
      }
      setLoading(false)
    }
    load()
  }, [txHash])

  if (loading) return (
    <div className="space-y-3 animate-pulse">
      <div className="h-8 bg-qtx-surface rounded w-64" />
      <div className="qtx-card">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="detail-row">
            <div className="h-4 bg-qtx-surface2 rounded w-32" />
            <div className="h-4 bg-qtx-surface2 rounded w-64" />
          </div>
        ))}
      </div>
    </div>
  )

  if (error || !tx || !blockInfo) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-xl font-bold text-white mb-2">Transaction Not Found</h2>
      <p className="text-qtx-muted mb-2 text-sm">Could not find transaction:</p>
      <p className="font-mono text-xs text-qtx-cyan break-all max-w-lg mx-auto mb-6">{txHash}</p>
      <Link href="/txs" className="px-4 py-2 border border-qtx-cyan text-qtx-cyan rounded text-sm hover:bg-qtx-cyan/10 transition-colors">
        View All Transactions
      </Link>
    </div>
  )

  const h = blockInfo.header
  const sigDisplay = tx.signature
    ? `${tx.signature.slice(0, 32)}...`
    : '(empty — devnet)'

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-qtx-dim">
        <Link href="/" className="hover:text-qtx-cyan">Home</Link>
        <span>›</span>
        <Link href="/txs" className="hover:text-qtx-cyan">Transactions</Link>
        <span>›</span>
        <span className="font-mono text-qtx-muted">{shortHash(txHash, 12, 8)}</span>
      </div>

      <h1 className="text-xl font-bold text-white">Transaction Details</h1>

      <div className="qtx-card">
        <Row label="Transaction Hash">
          <span className="font-mono text-sm text-qtx-cyan break-all">{txHash}</span>
        </Row>
        <Row label="Status">
          <span className="badge badge-success">✓ Success</span>
        </Row>
        <Row label="Block">
          <Link href={`/block/${h.height}`} className="text-qtx-cyan hover:underline font-mono">
            #{h.height}
          </Link>
          <span className="text-qtx-dim text-xs ml-3">
            {Math.floor(Date.now() / 1000) - h.timestamp > 0
              ? `${Math.floor(Date.now() / 1000) - h.timestamp} secs ago`
              : ''
            }
          </span>
        </Row>
        <Row label="Timestamp">
          <span>{new Date(h.timestamp * 1000).toUTCString()}</span>
          <span className="text-qtx-dim text-xs ml-2">({timeAgo(h.timestamp)})</span>
        </Row>
        <Row label="From">
          <Link href={`/address/${tx.sender}`} className="font-mono text-qtx-cyan hover:underline text-sm break-all">
            {tx.sender}
          </Link>
        </Row>
        <Row label="To">
          <Link href={`/address/${tx.receiver}`} className="font-mono text-qtx-cyan hover:underline text-sm break-all">
            {tx.receiver}
          </Link>
        </Row>
        <Row label="Value">
          <span className="font-mono text-qtx-green font-medium">{formatQTX(tx.amount)}</span>
          <span className="text-qtx-dim text-xs ml-2">({tx.amount?.toString()} nQTX)</span>
        </Row>
        <Row label="Transaction Fee">
          <span className="font-mono text-qtx-muted">
            {tx.gas_limit && tx.gas_price ? formatFee(tx.gas_limit, tx.gas_price) : '—'}
          </span>
        </Row>
        <Row label="Gas Limit">
          <span className="font-mono text-qtx-muted">
            {tx.gas_limit !== undefined ? Number(tx.gas_limit).toLocaleString() : '—'}
          </span>
        </Row>
        <Row label="Gas Price">
          <span className="font-mono text-qtx-muted">
            {tx.gas_price !== undefined ? `${tx.gas_price} nQTX` : '—'}
          </span>
        </Row>
        <Row label="Nonce">
          <span className="font-mono text-qtx-muted">{tx.nonce !== undefined ? tx.nonce : '—'}</span>
        </Row>
      </div>

      {/* Signature section */}
      <div className="qtx-card">
        <div className="px-5 py-3 border-b border-qtx-border bg-qtx-surface">
          <h2 className="text-sm font-semibold text-qtx-text">SPHINCS+ Signature</h2>
          <p className="text-xs text-qtx-dim mt-0.5">Post-quantum digital signature</p>
        </div>
        <div className="p-5">
          <code className="text-xs font-mono text-qtx-dim break-all">
            {sigDisplay}
          </code>
          {tx.signature && (
            <p className="text-xs text-qtx-dim mt-2">
              Signature length: {tx.signature.length} characters
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
