'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface ValidatorStat {
  address: string
  blocks_produced: number
  balance: string
}

const KNOWN_VALIDATORS = [
  '48f7a87739839bf99ff17f864de472a793e7d2558775c2c8dd41d4dd54d6c4fe',
  'dab0078285efce34e6c48e39e386fe835fcc7e3df1248491b3aac669fea7620c',
  '3bf59e360b14e776b5c1640d39325e8730fb32b375c0dfa4cbe5341cb0759d5c',
  'a19a344ca82fd4d48a3b60ea39e445bbdafe47631d9b7ed5e18732a8bfe771e0',
]

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
  const [validators, setValidators] = useState<ValidatorStat[]>([])
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchValidators = useCallback(async () => {
    try {
      // 1. Fetch all blocks
      const blocksRes = await fetch('/api/node/blocks?limit=500', { cache: 'no-store' })
      if (!blocksRes.ok) { setOnline(false); setLoading(false); return }
      const blocksData = await blocksRes.json()
      const blocks: Array<{ header: { proposer_id?: string; miner?: string } }> =
        Array.isArray(blocksData) ? blocksData : (blocksData.blocks || [])

      // 2. Count blocks per proposer
      const countMap = new Map<string, number>()
      for (const b of blocks) {
        const pid = b?.header?.proposer_id
        if (pid && pid.length > 10) {
          countMap.set(pid, (countMap.get(pid) || 0) + 1)
        }
      }

      // 3. Merge with known validators (add at count=0 if not seen)
      for (const addr of KNOWN_VALIDATORS) {
        if (!countMap.has(addr)) countMap.set(addr, 0)
      }

      // 4. Fetch balances in parallel
      const entries = Array.from(countMap.entries())
      const withBalances: ValidatorStat[] = await Promise.all(
        entries.map(async ([address, blocks_produced]) => {
          try {
            const r = await fetch(`/api/node/address/${address}`, { cache: 'no-store' })
            if (!r.ok) return { address, blocks_produced, balance: '0' }
            const d = await r.json()
            return { address, blocks_produced, balance: d.balance ?? d.Balance ?? '0' }
          } catch {
            return { address, blocks_produced, balance: '0' }
          }
        })
      )

      // 5. Sort by blocks_produced descending
      withBalances.sort((a, b) => b.blocks_produced - a.blocks_produced)

      setValidators(withBalances)
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
    const interval = setInterval(fetchValidators, 30000)
    return () => clearInterval(interval)
  }, [fetchValidators])

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
          { label: 'Total Validators', value: validators.length > 0 ? validators.length.toString() : '—', color: 'text-qtx-cyan' },
          { label: 'Active', value: validators.length > 0 ? validators.length.toString() : '—', color: 'text-qtx-green' },
          { label: 'Total Blocks', value: validators.reduce((s, v) => s + v.blocks_produced, 0).toLocaleString() || '—', color: 'text-qtx-yellow' },
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
                <th>#</th>
                <th>Validator Address</th>
                <th>Blocks Proposed</th>
                <th className="hidden sm:table-cell">Balance / Rewards</th>
                <th className="hidden md:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5}>
                      <div className="h-4 bg-qtx-surface2 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : validators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-qtx-dim text-sm">
                    No validator data available
                  </td>
                </tr>
              ) : validators.map((v, i) => (
                <tr key={v.address}>
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
                    <span className="font-mono text-xs text-qtx-text">{v.blocks_produced.toLocaleString()}</span>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className="font-mono text-xs text-qtx-green">{formatQTX(v.balance)}</span>
                  </td>
                  <td className="hidden md:table-cell">
                    <span className="badge badge-success">● Active</span>
                  </td>
                </tr>
              ))}
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
