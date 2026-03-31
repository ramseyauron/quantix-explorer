'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface BlockInfo {
  block_count: number
  best_block_hash: string
  genesis_block_hash: string
}

interface Block {
  header: {
    hash: string
    height: number
    timestamp: number
    parent_hash: string
    txs_root: string
    proposer_id: string
    nonce: string
  }
  body: { txs_list: Tx[] }
}

interface Tx {
  id: string
  sender: string
  receiver: string
  amount: string | number
  nonce: number
  gas_limit: string | number
  timestamp: number
}

function shortHash(h: string, n = 14) {
  if (!h) return '—'
  if (h.startsWith('GENESIS_')) return h.slice(0, 18) + '…'
  return h.slice(0, n) + '…' + h.slice(-6)
}

function formatQTX(a: string | number) {
  try {
    const n = BigInt(a.toString())
    if (n === 0n) return '0 QTX'
    const qtx = Number(n) / 1e18
    if (qtx < 0.0001) return `${n} nQTX`
    return qtx.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' QTX'
  } catch { return `${a}` }
}

function timeAgo(ts: number) {
  const s = Math.floor(Date.now() / 1000) - ts
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export default function HomePage() {
  const [status, setStatus] = useState<BlockInfo | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [online, setOnline] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, countRes] = await Promise.all([
        fetch('/api/node/', { cache: 'no-store' }),
        fetch('/api/node/blockcount', { cache: 'no-store' }),
      ])
      if (!statusRes.ok) { setOnline(false); return }

      const statusData = await statusRes.json()
      const countData = await countRes.json()
      const count = countData.count || 0

      setStatus(statusData.blockchain_info)
      setOnline(true)
      setLastUpdate(new Date())

      // Fetch all blocks
      const blockPromises = Array.from({ length: count }, (_, i) =>
        fetch(`/api/node/block/${i}`, { cache: 'no-store' }).then(r => r.json()).catch(() => null)
      )
      const fetched = (await Promise.all(blockPromises)).filter(Boolean) as Block[]
      setBlocks(fetched.reverse())
    } catch {
      setOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000) // refresh every 10s
    return () => clearInterval(interval)
  }, [fetchData])

  const totalTxs = blocks.reduce((s, b) => s + (b.body?.txs_list?.length || 0), 0)

  return (
    <div className="space-y-8">
      {/* Network Banner */}
      <div className="rounded-2xl border border-qtx-border bg-gradient-to-br from-qtx-surface to-qtx-bg p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-qtx-green blink' : 'bg-red-500'}`} />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                {loading ? 'Connecting…' : online ? 'Network Online' : 'Node Offline'}
              </span>
              {lastUpdate && (
                <span className="text-xs text-slate-600 ml-2">
                  Updated {timeAgo(Math.floor(lastUpdate.getTime() / 1000))}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">Quantix Devnet</h1>
            <p className="text-slate-500 text-sm mt-0.5">Chain ID: 73310 · Post-Quantum Layer 1</p>
          </div>
          <div className="flex gap-6">
            {[
              { label: 'Blocks', value: status?.block_count?.toLocaleString() ?? '—', color: 'text-qtx-cyan' },
              { label: 'Transactions', value: totalTxs.toLocaleString(), color: 'text-qtx-purple' },
              { label: 'Consensus', value: 'PBFT+PoS', color: 'text-qtx-green' },
              { label: 'Block Time', value: '10s', color: 'text-qtx-yellow' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
        {status?.genesis_block_hash && (
          <div className="mt-4 pt-4 border-t border-qtx-border">
            <span className="text-xs text-slate-500">Genesis: </span>
            <span className="font-mono text-xs text-qtx-cyan break-all">{status.genesis_block_hash}</span>
          </div>
        )}
      </div>

      {/* Blocks Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Latest Blocks</h2>
          {online && <span className="text-xs text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-qtx-green blink inline-block" /> Live · refreshes every 10s
          </span>}
        </div>

        <div className="rounded-xl border border-qtx-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-qtx-surface border-b border-qtx-border">
                <th className="px-4 py-3 text-left text-slate-500 font-medium">Block</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium hidden md:table-cell">Age</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium">Txns</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium hidden lg:table-cell">Hash</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium hidden lg:table-cell">Parent</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium hidden xl:table-cell">Proposer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-qtx-border/50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 bg-qtx-surface rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : !online ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="text-slate-600 mb-2">⚡ Node offline</div>
                    <code className="text-xs text-slate-700">Connecting to 164.68.118.17:8560…</code>
                  </td>
                </tr>
              ) : blocks.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-600">No blocks yet</td></tr>
              ) : blocks.map(b => {
                const h = b.header
                const txCount = b.body?.txs_list?.length || 0
                return (
                  <tr key={h.height} className="hover:bg-qtx-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/block/${h.height}`} className="text-qtx-cyan hover:underline font-mono font-semibold">
                        #{h.height}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{timeAgo(h.timestamp)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono ${txCount > 0 ? 'bg-qtx-cyan/10 text-qtx-cyan border border-qtx-cyan/20' : 'bg-slate-800 text-slate-500'}`}>
                        {txCount} tx
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Link href={`/block/${h.height}`} className="font-mono text-xs text-slate-400 hover:text-qtx-cyan">
                        {shortHash(h.hash)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-slate-600">{shortHash(h.parent_hash)}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="font-mono text-xs text-slate-500">{shortHash(h.proposer_id || '', 10)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Latest transactions preview */}
      {online && totalTxs > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
            <Link href="/txs" className="text-xs text-qtx-cyan hover:underline">View all →</Link>
          </div>
          <div className="rounded-xl border border-qtx-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-qtx-surface border-b border-qtx-border">
                  <th className="px-4 py-2.5 text-left text-slate-500 font-medium">Tx Hash</th>
                  <th className="px-4 py-2.5 text-left text-slate-500 font-medium hidden sm:table-cell">From</th>
                  <th className="px-4 py-2.5 text-left text-slate-500 font-medium hidden sm:table-cell">To</th>
                  <th className="px-4 py-2.5 text-left text-slate-500 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-qtx-border/40">
                {blocks.flatMap(b => (b.body?.txs_list || []).map(tx => ({ ...tx, blockHeight: b.header.height })))
                  .slice(0, 10)
                  .map((tx, i) => (
                  <tr key={`${tx.id}-${i}`} className="hover:bg-qtx-surface/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link href={`/tx/${encodeURIComponent(tx.id)}`} className="font-mono text-xs text-qtx-cyan hover:underline">
                        {shortHash(tx.id, 12)}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className="font-mono text-xs text-slate-400">{shortHash(tx.sender, 10)}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className="font-mono text-xs text-slate-400">{shortHash(tx.receiver, 10)}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-qtx-green">{formatQTX(tx.amount)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
