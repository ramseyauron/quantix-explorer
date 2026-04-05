'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Validator {
  address: string
  stake: string | number
  status: string
  blocks_produced?: number
  reward_address?: string
}

function shortHash(h: string, front = 12, back = 8) {
  if (!h) return '—'
  if (h.length <= front + back + 3) return h
  return h.slice(0, front) + '…' + h.slice(-back)
}

function formatQTX(a: string | number) {
  try {
    const n = BigInt(a.toString())
    if (n === 0n) return '0 QTX'
    const qtx = Number(n) / 1e18
    return qtx.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 }) + ' QTX'
  } catch { return `${a}` }
}

export default function ValidatorsPage() {
  const [validators, setValidators] = useState<Validator[]>([])
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchValidators = useCallback(async () => {
    try {
      const res = await fetch('/api/node/validators', { cache: 'no-store' })
      if (!res.ok) { setOnline(false); setLoading(false); return }
      const data = await res.json()
      setValidators(data.validators || data || [])
      setOnline(true)
      setLastUpdate(new Date())
    } catch {
      setOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchValidators()
    const interval = setInterval(fetchValidators, 15000)
    return () => clearInterval(interval)
  }, [fetchValidators])

  const activeCount = validators.filter(v =>
    !v.status || v.status === 'active' || v.status === 'Active'
  ).length
  const pendingCount = validators.filter(v =>
    v.status === 'pending' || v.status === 'Pending'
  ).length

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-qtx-dim">
        <Link href="/" className="hover:text-qtx-cyan">Home</Link>
        <span>›</span>
        <span className="text-qtx-muted">Validators</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Validator Set</h1>
          <p className="text-qtx-dim text-sm mt-1">PBFT+PoS consensus · Active set: up to 21 validators</p>
        </div>
        {lastUpdate && (
          <span className="text-xs text-qtx-dim">
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Registered', value: validators.length > 0 ? validators.length.toString() : '—', color: 'text-qtx-cyan' },
          { label: 'Active', value: activeCount > 0 ? activeCount.toString() : (validators.length > 0 ? validators.length.toString() : '—'), color: 'text-qtx-green' },
          { label: 'Pending', value: pendingCount.toString(), color: 'text-qtx-yellow' },
          { label: 'Max Active Set', value: '21', color: 'text-qtx-purple-light' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="text-xs text-qtx-dim uppercase tracking-wide mb-2 font-medium">{label}</div>
            <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Validator Table */}
      <div className="qtx-card overflow-hidden">
        <div className="px-4 py-3 border-b border-qtx-border bg-qtx-surface flex items-center justify-between">
          <h2 className="font-semibold text-qtx-text text-sm">All Validators</h2>
          {online && (
            <span className="flex items-center gap-1.5 text-xs text-qtx-dim">
              <span className="live-dot" />
              Live
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="qtx-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Validator Address</th>
                <th>Stake</th>
                <th className="hidden sm:table-cell">Status</th>
                <th className="hidden md:table-cell">Blocks Produced</th>
                <th className="hidden lg:table-cell">Reward Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}>
                      <div className="h-4 bg-qtx-surface2 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : !online ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="text-qtx-dim text-sm mb-2">Validators endpoint unavailable</div>
                    <code className="text-xs text-qtx-dim/60">GET /validators not yet live on node</code>
                  </td>
                </tr>
              ) : validators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-qtx-dim text-sm">
                    No validators registered yet
                  </td>
                </tr>
              ) : validators.map((v, i) => {
                const isActive = !v.status || v.status === 'active' || v.status === 'Active'
                const isPending = v.status === 'pending' || v.status === 'Pending'
                return (
                  <tr key={i}>
                    <td>
                      <span className="font-mono text-qtx-dim text-xs">{i + 1}</span>
                    </td>
                    <td>
                      <Link href={`/address/${encodeURIComponent(v.address)}`}
                        className="font-mono text-xs text-qtx-cyan hover:underline">
                        {shortHash(v.address)}
                      </Link>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-qtx-green">{formatQTX(v.stake)}</span>
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className={`badge ${isActive ? 'badge-success' : isPending ? 'badge-pending' : 'badge-failed'}`}>
                        {isActive ? '● Active' : isPending ? '○ Pending' : v.status}
                      </span>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="font-mono text-xs text-qtx-dim">
                        {v.blocks_produced !== undefined ? v.blocks_produced.toLocaleString() : '—'}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell">
                      {v.reward_address ? (
                        <Link href={`/address/${v.reward_address}`} className="font-mono text-xs text-qtx-muted hover:text-qtx-cyan">
                          {shortHash(v.reward_address, 8, 6)}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-qtx-dim">Same</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info box */}
      <div className="qtx-card p-5 text-sm text-qtx-muted space-y-2">
        <h3 className="text-white font-semibold text-sm">About Validators</h3>
        <p>Quantix uses a PBFT+PoS hybrid consensus. Up to 21 validators form the active set per epoch, selected by stake weight. A minimum of <span className="text-qtx-cyan">32 QTX</span> stake is required to register as a validator.</p>
        <p>Consensus requires <span className="text-qtx-cyan">⌊2N/3⌋ + 1</span> votes for both prepare and commit phases, ensuring BFT safety with up to ⌊(N-1)/3⌋ Byzantine validators.</p>
      </div>
    </div>
  )
}
