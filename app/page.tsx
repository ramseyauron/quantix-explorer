'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface BlockInfo {
  block_count: number
  best_block_hash: string
  genesis_block_hash: string
  synced?: boolean
  sync_state?: string
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

interface Validator {
  address: string
  stake: string | number
  status: string
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
  const [validators, setValidators] = useState<Validator[]>([])
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

      // Fetch validators (may not exist yet)
      try {
        const valRes = await fetch('/api/node/validators', { cache: 'no-store' })
        if (valRes.ok) {
          const valData = await valRes.json()
          setValidators(valData.validators || valData || [])
        }
      } catch { /* validators endpoint may not be live yet */ }
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
  const currentHeight = status?.block_count ?? 0
  const isSynced = status?.synced !== false // default true if not specified
  const syncLabel = isSynced ? 'Synced' : 'Syncing…'
  const activeValidators = validators.filter(v => v.status === 'active' || v.status === 'Active').length

  return (
    <div className="space-y-8">
      {/* Network Banner */}
      <div className="rounded-2xl border border-qtx-border bg-gradient-to-br from-qtx-surface to-qtx-bg p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${online ? 'pulse-dot-green' : 'bg-red-500'}`} style={online ? { boxShadow: '0 0 8px #00ff88, 0 0 16px rgba(0,255,136,0.4)' } : {}} />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest" style={{ fontFamily: 'var(--font-heading)' }}>
                {loading ? 'Connecting…' : online ? 'Network Online' : 'Node Offline'}
              </span>
              {online && (
                <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ml-1 ${isSynced ? 'text-qtx-green border-qtx-green/30 bg-qtx-green/10' : 'text-qtx-yellow border-qtx-yellow/30 bg-qtx-yellow/10'}`}>
                  {syncLabel}
                </span>
              )}
              {lastUpdate && (
                <span className="text-xs text-slate-600 ml-2">
                  Updated {timeAgo(Math.floor(lastUpdate.getTime() / 1000))}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white font-heading">Quantix Devnet</h1>
            <p className="text-slate-500 text-sm mt-0.5 font-body">Chain ID: 73310 · Post-Quantum Layer 1</p>
          </div>
          <div className="flex gap-6">
            {[
              { label: 'Block Height', value: currentHeight > 0 ? `#${currentHeight.toLocaleString()}` : '—', color: 'text-qtx-cyan' },
              { label: 'Transactions', value: totalTxs.toLocaleString(), color: 'text-qtx-purple' },
              { label: 'Consensus', value: 'PBFT+PoS', color: 'text-qtx-green' },
              { label: 'Block Time', value: '10s', color: 'text-qtx-yellow' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`text-xl font-bold font-mono ${color}`} style={{ textShadow: color === 'text-qtx-cyan' ? '0 0 10px rgba(0,255,255,0.5)' : color === 'text-qtx-purple' ? '0 0 10px rgba(123,97,255,0.5)' : color === 'text-qtx-green' ? '0 0 10px rgba(0,255,136,0.5)' : 'none' }}>{value}</div>
                <div className="text-xs text-slate-500 mt-0.5 font-body">{label}</div>
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

      {/* Validator Set */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white font-heading">Validator Set</h2>
          <Link href="/validators" className="text-xs text-qtx-purple hover:underline">View all →</Link>
        </div>
        <div className="rounded-xl border border-qtx-border bg-qtx-surface/50 p-5">
          <div className="flex items-center gap-6 flex-wrap mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-qtx-purple" style={{ textShadow: '0 0 10px rgba(123,97,255,0.5)' }}>
                {validators.length > 0 ? (activeValidators > 0 ? activeValidators : validators.length) : (online ? '—' : '—')}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Active Validators</div>
            </div>
            <div className="text-slate-600 text-lg">/</div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-slate-400">21</div>
              <div className="text-xs text-slate-500 mt-0.5">Max Active Set</div>
            </div>
            {validators.length > 0 && (
              <div className="flex-1 min-w-48">
                <div className="h-2 bg-qtx-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-qtx-purple to-qtx-cyan"
                    style={{ width: `${Math.min(100, (validators.length / 21) * 100)}%` }} />
                </div>
                <div className="text-xs text-slate-600 mt-1">{validators.length} / 21 slots filled</div>
              </div>
            )}
          </div>
          {validators.length > 0 ? (
            <div className="space-y-2">
              {validators.slice(0, 5).map((v, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-qtx-bg/50 border border-qtx-border/50">
                  <span className="font-mono text-xs text-slate-400">{shortHash(v.address, 16)}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-qtx-green">{formatQTX(v.stake)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${v.status === 'active' || v.status === 'Active' ? 'text-qtx-green border-qtx-green/30 bg-qtx-green/10' : 'text-qtx-yellow border-qtx-yellow/30 bg-qtx-yellow/10'}`}>
                      {v.status || 'active'}
                    </span>
                  </div>
                </div>
              ))}
              {validators.length > 5 && (
                <Link href="/validators" className="text-xs text-qtx-purple hover:underline block text-center pt-1">
                  + {validators.length - 5} more validators
                </Link>
              )}
            </div>
          ) : (
            <div className="text-slate-600 text-sm text-center py-2">
              {online ? 'Validator data loading…' : 'Node offline'}
            </div>
          )}
        </div>
      </div>

      {/* Blocks Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white font-heading">Latest Blocks</h2>
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
                      <Link href={`/block/${h.height}`} className="font-mono text-xs text-slate-400 hover:text-qtx-cyan" style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace' }}>
                        {shortHash(h.hash)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-slate-600" style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace' }}>{shortHash(h.parent_hash)}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="font-mono text-xs text-slate-500" style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace' }}>{shortHash(h.proposer_id || '', 10)}</span>
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
            <h2 className="text-lg font-semibold text-white font-heading">Recent Transactions</h2>
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

