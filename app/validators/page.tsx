'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Validator {
  address: string
  stake: string | number
  status: string
}

function shortHash(h: string, n = 16) {
  if (!h) return '—'
  return h.slice(0, n) + '…' + h.slice(-8)
}

function formatQTX(a: string | number) {
  try {
    const n = BigInt(a.toString())
    if (n === 0n) return '0 QTX'
    const qtx = Number(n) / 1e18
    if (qtx < 0.0001) return `${n} nQTX`
    return qtx.toLocaleString('en-US', { maximumFractionDigits: 4 }) + ' QTX'
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
      if (!res.ok) { setOnline(false); return }
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
    v.status === 'active' || v.status === 'Active'
  ).length
  const pendingCount = validators.filter(v =>
    v.status === 'pending' || v.status === 'Pending'
  ).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 font-body">
          <Link href="/" className="hover:text-qtx-cyan transition-colors">Explorer</Link>
          <span>/</span>
          <span className="text-slate-400">Validators</span>
        </div>
        <h1 className="text-2xl font-bold text-white font-heading">Validator Set</h1>
        <p className="text-slate-500 text-sm mt-1 font-body">PBFT+PoS consensus · Active set: up to 21 validators</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Registered', value: validators.length > 0 ? validators.length : '—', color: 'text-qtx-cyan' },
          { label: 'Active', value: activeCount > 0 ? activeCount : (validators.length > 0 ? validators.length : '—'), color: 'text-qtx-green' },
          { label: 'Pending', value: pendingCount || '0', color: 'text-qtx-yellow' },
          { label: 'Max Active Set', value: '21', color: 'text-qtx-purple' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-qtx-border bg-qtx-surface p-4 text-center">
            <div className={`text-2xl font-bold font-mono ${color}`}>{String(value)}</div>
            <div className="text-xs text-slate-500 mt-1 font-body">{label}</div>
          </div>
        ))}
      </div>

      {/* Validator Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white font-heading">All Validators</h2>
          {lastUpdate && (
            <span className="text-xs text-slate-600 font-body">
              Updated {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="rounded-xl border border-qtx-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-qtx-surface border-b border-qtx-border">
                <th className="px-4 py-3 text-left text-slate-500 font-medium">#</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium">Address (Fingerprint)</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium">Stake</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-qtx-border/50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3">
                      <div className="h-4 bg-qtx-surface rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : !online ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="text-slate-600 mb-2">⚡ Validators endpoint unavailable</div>
                    <code className="text-xs text-slate-700">GET /validators not yet live on node</code>
                  </td>
                </tr>
              ) : validators.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-600">
                    No validators registered yet
                  </td>
                </tr>
              ) : validators.map((v, i) => {
                const isActive = v.status === 'active' || v.status === 'Active' || !v.status
                return (
                  <tr key={i} className="hover:bg-qtx-surface/50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/address/${encodeURIComponent(v.address)}`}
                        className="font-mono text-xs text-qtx-cyan hover:underline break-all"
                        style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace' }}>
                        {v.address.length > 30 ? shortHash(v.address) : v.address}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-qtx-green">{formatQTX(v.stake)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
                        isActive
                          ? 'text-qtx-green border-qtx-green/30 bg-qtx-green/10'
                          : 'text-qtx-yellow border-qtx-yellow/30 bg-qtx-yellow/10'
                      }`}>
                        {v.status || 'active'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-qtx-border bg-qtx-surface/30 p-5 text-sm text-slate-400 space-y-2 font-body">
        <h3 className="text-white font-semibold font-heading">About Validators</h3>
        <p>Quantix uses a PBFT+PoS hybrid consensus. Up to 21 validators form the active set per epoch, selected by stake weight. A minimum of <span className="text-qtx-cyan">32 QTX</span> stake is required to register as a validator.</p>
        <p>Consensus requires <span className="text-qtx-cyan">⌊2N/3⌋ + 1</span> votes for both prepare and commit phases, ensuring BFT safety even with up to ⌊(N-1)/3⌋ Byzantine validators.</p>
      </div>
    </div>
  )
}
