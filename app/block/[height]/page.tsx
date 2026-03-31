import { getBlock, formatTimestamp, shortHash, formatAmount, timeAgo } from '@/lib/api'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 30

export default async function BlockPage({ params }: { params: { height: string } }) {
  const height = parseInt(params.height)
  if (isNaN(height)) notFound()

  const block = await getBlock(height)
  if (!block) notFound()

  const h = block.header
  const txs = block.body?.txs_list || []

  const fields = [
    { label: 'Block Height', value: `#${h.height}`, mono: true, color: 'text-qtx-cyan' },
    { label: 'Status', value: '✅ Confirmed', color: 'text-qtx-green' },
    { label: 'Timestamp', value: formatTimestamp(h.timestamp) + ` (${timeAgo(h.timestamp)})` },
    { label: 'Transactions', value: `${txs.length} transactions` },
    { label: 'Version', value: String(h.version) },
    { label: 'Nonce', value: h.nonce, mono: true },
    { label: 'Gas Limit', value: h.gas_limit, mono: true },
    { label: 'Gas Used', value: h.gas_used, mono: true },
    { label: 'Block Hash', value: h.hash, mono: true, break: true },
    { label: 'Parent Hash', value: h.parent_hash, mono: true, break: true },
    { label: 'Txs Root', value: h.txs_root, mono: true, break: true },
    { label: 'State Root', value: h.state_root, mono: true, break: true },
    { label: 'Uncles Hash', value: h.uncles_hash, mono: true, break: true },
    { label: 'Extra Data', value: h.extra_data || '—' },
    { label: 'Proposer / Miner', value: h.proposer_id || h.miner || '—', mono: true },
    { label: 'Difficulty', value: h.difficulty, mono: true },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-qtx-cyan transition-colors">Home</Link>
        <span>›</span>
        <span className="text-slate-300">Block #{h.height}</span>
      </div>

      {/* Block Header Card */}
      <div className="rounded-xl border border-qtx-border bg-qtx-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-qtx-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-qtx-cyan/10 border border-qtx-cyan/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Block #{h.height}</h1>
              <p className="text-xs text-slate-500">Quantix Devnet · {timeAgo(h.timestamp)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {height > 0 && (
              <Link href={`/block/${height - 1}`}
                className="px-3 py-1.5 text-xs border border-qtx-border rounded-lg text-slate-400 hover:border-qtx-cyan hover:text-qtx-cyan transition-colors">
                ← Prev
              </Link>
            )}
            <Link href={`/block/${height + 1}`}
              className="px-3 py-1.5 text-xs border border-qtx-border rounded-lg text-slate-400 hover:border-qtx-cyan hover:text-qtx-cyan transition-colors">
              Next →
            </Link>
          </div>
        </div>

        <div className="divide-y divide-qtx-border/40">
          {fields.map(({ label, value, mono, color, break: br }) => (
            <div key={label} className="px-6 py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0">
              <div className="sm:w-48 text-sm text-slate-500 shrink-0">{label}</div>
              <div className={`text-sm ${mono ? 'font-mono' : ''} ${color || 'text-slate-200'} ${br ? 'break-all' : ''}`}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Transactions
          <span className="ml-2 px-2 py-0.5 rounded text-xs font-mono bg-qtx-cyan/10 text-qtx-cyan border border-qtx-cyan/20">
            {txs.length}
          </span>
        </h2>

        {txs.length === 0 ? (
          <div className="rounded-xl border border-qtx-border bg-qtx-surface p-8 text-center text-slate-600">
            No transactions in this block
          </div>
        ) : (
          <div className="rounded-xl border border-qtx-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-qtx-surface border-b border-qtx-border">
                  <th className="px-4 py-3 text-left text-slate-500 font-medium">Tx Hash</th>
                  <th className="px-4 py-3 text-left text-slate-500 font-medium hidden md:table-cell">From</th>
                  <th className="px-4 py-3 text-left text-slate-500 font-medium hidden md:table-cell">To</th>
                  <th className="px-4 py-3 text-left text-slate-500 font-medium">Amount</th>
                  <th className="px-4 py-3 text-left text-slate-500 font-medium hidden lg:table-cell">Nonce</th>
                  <th className="px-4 py-3 text-left text-slate-500 font-medium hidden lg:table-cell">Gas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-qtx-border/40">
                {txs.map((tx, i) => (
                  <tr key={tx.id || i} className="hover:bg-qtx-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/tx/${encodeURIComponent(tx.id || '')}`}
                        className="font-mono text-xs text-qtx-cyan hover:underline">
                        {shortHash(tx.id || '', 14)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-slate-400">{shortHash(tx.sender, 12)}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-slate-400">{shortHash(tx.receiver, 12)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-qtx-green">{formatAmount(tx.amount)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-slate-500">{tx.nonce}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-slate-500">{tx.gas_limit?.toString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
