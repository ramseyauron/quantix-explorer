'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface AddressSummary {
  address: string
  balance: number
  total_received: number
  total_sent: number
  tx_count: number
}

interface Tx {
  hash: string
  block: number
  timestamp: number
  from: string
  to: string
  amount: string
  gas_limit: string
  gas_price: string
  nonce: number
  direction: 'in' | 'out'
}

function shortAddr(a: string, n = 10) {
  if (!a) return '—'
  return a.slice(0, n) + '…' + a.slice(-6)
}

function formatQTX(wei: string | number) {
  try {
    const n = BigInt(wei.toString())
    if (n === 0n) return '0 QTX'
    const qtx = Number(n) / 1e18
    return qtx.toLocaleString('en-US', { maximumFractionDigits: 6 }) + ' QTX'
  } catch { return `${wei}` }
}

function timeAgo(ts: number) {
  if (!ts) return '—'
  const s = Math.floor(Date.now() / 1000) - ts
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(ts * 1000).toLocaleString()
}

export default function AddressPage() {
  const { addr } = useParams<{ addr: string }>()
  const [summary, setSummary] = useState<AddressSummary | null>(null)
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'txs' | 'info'>('txs')

  useEffect(() => {
    async function load() {
      try {
        const [sumRes, txsRes] = await Promise.all([
          fetch(`/api/node/address/${addr}`, { cache: 'no-store' }),
          fetch(`/api/node/address/${addr}/txs`, { cache: 'no-store' }),
        ])
        if (sumRes.ok) setSummary(await sumRes.json())
        if (txsRes.ok) {
          const d = await txsRes.json()
          setTxs(d.transactions || [])
        }
      } catch { /* offline */ }
      setLoading(false)
    }
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [addr])

  const copyAddr = () => {
    navigator.clipboard.writeText(addr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="space-y-3 animate-pulse max-w-4xl mx-auto">
      <div className="h-12 bg-qtx-surface rounded-xl" />
      {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-qtx-surface rounded-xl" />)}
    </div>
  )

  const balance = summary?.balance ?? 0
  const received = summary?.total_received ?? 0
  const sent = summary?.total_sent ?? 0
  const txCount = summary?.tx_count ?? txs.length

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-qtx-cyan transition-colors">Home</Link>
        <span>›</span>
        <span className="text-slate-300">Address</span>
      </div>

      {/* Address Header */}
      <div className="rounded-2xl border border-qtx-border bg-gradient-to-br from-qtx-surface to-qtx-bg p-6">
        <div className="flex items-start gap-4">
          {/* Identicon */}
          <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-2xl"
            style={{ background: `linear-gradient(135deg, #${addr.slice(2, 8) || '00d4ff'}40, #7b2fff20)`, border: '1px solid rgba(0,212,255,0.2)' }}>
            🔷
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-500 uppercase tracking-widest">Address</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-sm text-qtx-cyan font-mono break-all">{addr}</code>
              <button onClick={copyAddr}
                className="text-xs px-2 py-0.5 rounded bg-qtx-surface border border-qtx-border text-slate-400 hover:text-qtx-cyan hover:border-qtx-cyan transition-colors shrink-0">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-qtx-border">
          {[
            {
              label: 'QTX Balance',
              value: formatQTX(balance),
              sub: `≈ ${(Number(BigInt(balance >= 0 ? balance : 0)) / 1e18).toFixed(4)} QTX`,
              color: 'text-qtx-cyan',
              icon: '◈',
            },
            {
              label: 'Total Received',
              value: formatQTX(received),
              sub: `${txs.filter(t => t.direction === 'in').length} inbound txs`,
              color: 'text-qtx-green',
              icon: '↙',
            },
            {
              label: 'Total Sent',
              value: formatQTX(sent),
              sub: `${txs.filter(t => t.direction === 'out').length} outbound txs`,
              color: 'text-qtx-red',
              icon: '↗',
            },
            {
              label: 'Transactions',
              value: txCount.toLocaleString(),
              sub: 'total interactions',
              color: 'text-qtx-purple',
              icon: '⇄',
            },
          ].map(({ label, value, sub, color, icon }) => (
            <div key={label} className="bg-qtx-bg/50 rounded-xl p-4 border border-qtx-border/50">
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`${color} text-lg`}>{icon}</span>
                <span className="text-xs text-slate-500">{label}</span>
              </div>
              <div className={`text-base font-bold font-mono ${color} leading-tight`}>{value}</div>
              <div className="text-xs text-slate-600 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-qtx-border">
        {[
          { id: 'txs', label: `Transactions (${txCount})` },
          { id: 'info', label: 'Address Info' },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-qtx-cyan border-qtx-cyan'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transactions Tab */}
      {activeTab === 'txs' && (
        <div className="rounded-xl border border-qtx-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-qtx-surface border-b border-qtx-border">
                <th className="px-4 py-3 text-left text-slate-500 font-medium">Tx Hash</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium hidden sm:table-cell">Block</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium hidden md:table-cell">Age</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium">From</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium hidden md:table-cell">To</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium">Value</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium hidden lg:table-cell">Dir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-qtx-border/40">
              {txs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-600">
                  No transactions found for this address
                </td></tr>
              ) : txs.map((tx, i) => (
                <tr key={`${tx.hash}-${i}`} className="hover:bg-qtx-surface/40 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/tx/${encodeURIComponent(tx.hash)}`}
                      className="font-mono text-xs text-qtx-cyan hover:underline">
                      {tx.hash.slice(0, 12)}…{tx.hash.slice(-6)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Link href={`/block/${tx.block}`} className="text-xs text-slate-400 hover:text-qtx-cyan">
                      #{tx.block}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">
                    {timeAgo(tx.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    {tx.from === addr ? (
                      <span className="font-mono text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">Self</span>
                    ) : (
                      <Link href={`/address/${tx.from}`} className="font-mono text-xs text-slate-400 hover:text-qtx-cyan">
                        {shortAddr(tx.from)}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {tx.to === addr ? (
                      <span className="font-mono text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">Self</span>
                    ) : (
                      <Link href={`/address/${tx.to}`} className="font-mono text-xs text-slate-400 hover:text-qtx-cyan">
                        {shortAddr(tx.to)}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs font-medium ${tx.direction === 'in' ? 'text-qtx-green' : 'text-qtx-red'}`}>
                      {tx.direction === 'in' ? '+' : '-'}{formatQTX(tx.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      tx.direction === 'in'
                        ? 'bg-qtx-green/10 text-qtx-green border border-qtx-green/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {tx.direction === 'in' ? 'IN' : 'OUT'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="rounded-xl border border-qtx-border bg-qtx-surface overflow-hidden">
          <div className="divide-y divide-qtx-border/40">
            {[
              { label: 'Address', value: addr, mono: true, break: true },
              { label: 'Balance (nQTX)', value: balance.toLocaleString(), mono: true },
              { label: 'Balance (QTX)', value: formatQTX(balance), mono: true },
              { label: 'Total Received', value: formatQTX(received), mono: true },
              { label: 'Total Sent', value: formatQTX(sent), mono: true },
              { label: 'Transaction Count', value: txCount.toString(), mono: true },
              { label: 'Network', value: 'Quantix Devnet (ChainID: 73310)' },
              { label: 'Signature Scheme', value: 'SPHINCS+ (Post-Quantum)' },
            ].map(({ label, value, mono, break: br }) => (
              <div key={label} className="px-6 py-3 flex flex-col sm:flex-row gap-1">
                <div className="sm:w-48 text-sm text-slate-500 shrink-0">{label}</div>
                <div className={`text-sm ${mono ? 'font-mono' : ''} text-slate-200 ${br ? 'break-all' : ''}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
