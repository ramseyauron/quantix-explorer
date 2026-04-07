'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface ValidatorData {
  address: string
  name: string
  blocks_produced: number
  balance: string | number
  uptime: number // relative percentage vs highest producer
}

const KNOWN_VALIDATORS: { address: string; name: string }[] = [
  { address: 'd115e72be0e862923d5fe86898ccea50d15e4b78dc46fb1ee28ab398064ef064', name: 'Node-0' },
  { address: '34238e54849b46bbf7da1d7c506864f7a600824b97c076325c9395b98f91d317', name: 'Node-1' },
  { address: '61bbb1caf8ec527265e9718dfd3f6f2075b9be5db84dfc18023e252ab36d9ca3', name: 'Node-2' },
  { address: '1973bb6005de5fa453bca0eae7a9827a577fae96a28fa7d5ead83bbc7b2eadc7', name: 'Node-3' },
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

function UptimeBar({ value }: { value: number }) {
  const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-qtx-surface2 rounded-full h-1.5 overflow-hidden max-w-[80px]">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{value.toFixed(0)}%</span>
    </div>
  )
}

export default function ValidatorsPage() {
  const [validators, setValidators] = useState<ValidatorData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchValidators = useCallback(async () => {
    try {
      const countRes = await fetch('/api/node/blockcount', { cache: 'no-store' })
      const { count } = await countRes.json()

      // Fetch all blocks to scan proposers
      const blockPromises = Array.from({ length: count }, (_, i) =>
        fetch(`/api/node/block/${i}`, { cache: 'no-store' }).then(r => r.json()).catch(() => null)
      )
      const blocks = (await Promise.all(blockPromises)).filter(Boolean)

      // Count blocks per proposer
      const proposerCount: Record<string, number> = {}
      for (const b of blocks) {
        const proposer = b.header?.proposer_id
        if (proposer) {
          proposerCount[proposer] = (proposerCount[proposer] || 0) + 1
        }
      }

      // Merge known validators + discovered proposers
      const allAddresses = new Set<string>([
        ...KNOWN_VALIDATORS.map(v => v.address),
        ...Object.keys(proposerCount),
      ])

      // Fetch balances for all validators
      const validatorList: ValidatorData[] = []
      for (const address of allAddresses) {
        let balance: string | number = 0
        try {
          const res = await fetch(`/api/node/address/${address}`, { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            balance = data.balance ?? 0
          }
        } catch { /* skip */ }

        const known = KNOWN_VALIDATORS.find(v => v.address === address)
        validatorList.push({
          address,
          name: known?.name ?? shortHash(address, 6, 4),
          blocks_produced: proposerCount[address] || 0,
          balance,
          uptime: 0, // calculated below
        })
      }

      // Calculate relative uptime
      const maxBlocks = Math.max(...validatorList.map(v => v.blocks_produced), 1)
      for (const v of validatorList) {
        v.uptime = Math.round((v.blocks_produced / maxBlocks) * 100)
      }

      // Sort by blocks produced desc
      validatorList.sort((a, b) => b.blocks_produced - a.blocks_produced)

      setValidators(validatorList)
      setLastUpdate(new Date())
    } catch {
      // Use known validators as fallback
      setValidators(KNOWN_VALIDATORS.map(v => ({
        ...v,
        blocks_produced: 0,
        balance: 0,
        uptime: 0,
      })))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchValidators()
    const interval = setInterval(fetchValidators, 30000)
    return () => clearInterval(interval)
  }, [fetchValidators])

  const totalBlocks = validators.reduce((s, v) => s + v.blocks_produced, 0)

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-qtx-dim">
        <Link href="/" className="hover:text-qtx-cyan">Home</Link>
        <span>›</span>
        <span className="text-qtx-muted">Validators</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
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
          { label: 'Active', value: validators.length > 0 ? validators.filter(v => v.blocks_produced > 0).length.toString() : '—', color: 'text-qtx-green' },
          { label: 'Total Blocks', value: totalBlocks > 0 ? totalBlocks.toLocaleString() : '—', color: 'text-qtx-yellow' },
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
          <span className="flex items-center gap-1.5 text-xs text-qtx-dim">
            <span className="live-dot" />
            Live · 30s
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="qtx-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Validator</th>
                <th className="hidden sm:table-cell">Address</th>
                <th>Blocks</th>
                <th className="hidden sm:table-cell">Uptime</th>
                <th className="hidden md:table-cell">Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}>
                      <div className="h-4 bg-qtx-surface2 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : validators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-qtx-dim text-sm">
                    No validators found
                  </td>
                </tr>
              ) : validators.map((v, i) => (
                <tr key={v.address}>
                  <td>
                    <span className="font-mono text-qtx-dim text-xs">{i + 1}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: `hsl(${i * 60 + 180}, 60%, 25%)`, color: `hsl(${i * 60 + 180}, 80%, 65%)` }}>
                        {v.name.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-qtx-text text-xs font-medium">{v.name}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell">
                    <Link href={`/address/${v.address}`}
                      className="font-mono text-xs text-qtx-cyan hover:underline">
                      {shortHash(v.address)}
                    </Link>
                  </td>
                  <td>
                    <span className={`font-mono text-xs ${v.blocks_produced > 0 ? 'text-qtx-text' : 'text-qtx-dim'}`}>
                      {v.blocks_produced.toLocaleString()}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell">
                    <UptimeBar value={v.uptime} />
                  </td>
                  <td className="hidden md:table-cell">
                    <span className="font-mono text-xs text-qtx-green">{formatQTX(v.balance)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info box */}
      <div className="qtx-card p-5 text-sm text-qtx-muted space-y-2">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
          About Validators
        </h3>
        <p>Quantix uses a <span className="text-qtx-cyan">PBFT+PoS</span> hybrid consensus. Up to <span className="text-qtx-cyan">21 validators</span> form the active set per epoch, selected by stake weight. A minimum of <span className="text-qtx-cyan">32 QTX</span> stake is required to register as a validator.</p>
        <p>Consensus requires <span className="text-qtx-cyan">⌊2N/3⌋ + 1</span> votes for both prepare and commit phases, ensuring BFT safety with up to ⌊(N-1)/3⌋ Byzantine validators.</p>
        <p className="text-xs text-qtx-dim">Uptime is calculated as blocks produced relative to the highest-producing validator in this session. Data is derived from on-chain block proposer fields.</p>
      </div>
    </div>
  )
}
