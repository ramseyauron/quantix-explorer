import { getAllBlocks, formatTimestamp, shortHash, formatAmount, timeAgo } from '@/lib/api'
import Link from 'next/link'


export const revalidate = 0

export default async function TxPage({ params }: { params: { hash: string } }) {
  const hash = decodeURIComponent(params.hash)
  const blocks = await getAllBlocks()

  let foundTx: import("@/lib/api").Transaction | null = null
  let foundBlock: import("@/lib/api").Block | null = null

  for (const block of blocks) {
    const tx = (block.body?.txs_list || []).find(t => t.id === hash)
    if (tx) { foundTx = tx; foundBlock = block; break }
  }

  if (!foundTx) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-qtx-cyan">Home</Link>
          <span>›</span>
          <span className="text-slate-300">Transaction</span>
        </div>
        <div className="rounded-xl border border-qtx-border bg-qtx-surface p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-white mb-2">Transaction Not Found</h2>
          <p className="text-slate-500 mb-2">Could not find transaction:</p>
          <p className="font-mono text-xs text-qtx-cyan break-all max-w-lg mx-auto">{hash}</p>
          <p className="text-slate-600 text-sm mt-4">
            The transaction may be in a block not yet loaded, or the node may be offline.
          </p>
          <Link href="/txs" className="inline-block mt-6 px-4 py-2 border border-qtx-cyan text-qtx-cyan rounded-lg text-sm hover:bg-qtx-cyan/10 transition-colors">
            View All Transactions
          </Link>
        </div>
      </div>
    )
  }

  const block = foundBlock! // safe: checked above
  const fields = [
    { label: 'Transaction Hash', value: foundTx.id, mono: true, break: true, color: 'text-qtx-cyan' },
    { label: 'Status', value: '✅ Confirmed', color: 'text-qtx-green' },
    { label: 'Block', value: `#${block.header.height}`, link: `/block/${block.header.height}`, color: 'text-qtx-cyan' },
    { label: 'Timestamp', value: formatTimestamp(block.header.timestamp) + ` (${timeAgo(block.header.timestamp)})` },
    { label: 'From', value: foundTx.sender, mono: true, break: true },
    { label: 'To', value: foundTx.receiver, mono: true, break: true },
    { label: 'Amount', value: formatAmount(foundTx.amount), color: 'text-qtx-green', mono: true },
    { label: 'Gas Limit', value: foundTx.gas_limit?.toString(), mono: true },
    { label: 'Gas Price', value: foundTx.gas_price?.toString() + ' nQTX', mono: true },
    { label: 'Nonce', value: String(foundTx.nonce), mono: true },
    { label: 'Raw Amount (nQTX)', value: foundTx.amount?.toString(), mono: true },
    { label: 'Signature', value: foundTx.signature || '(empty — devnet)', mono: true, break: true, color: 'text-slate-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-qtx-cyan transition-colors">Home</Link>
        <span>›</span>
        <Link href="/txs" className="hover:text-qtx-cyan transition-colors">Transactions</Link>
        <span>›</span>
        <span className="text-slate-300 font-mono text-xs">{shortHash(hash, 14)}</span>
      </div>

      <div className="rounded-xl border border-qtx-border bg-qtx-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-qtx-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-qtx-purple/10 border border-qtx-purple/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b2fff" strokeWidth="2">
              <path d="M7 16L3 12l4-4M17 8l4 4-4 4M14 4l-4 16"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Transaction Details</h1>
            <p className="text-xs text-slate-500 font-mono">{shortHash(hash, 20)}</p>
          </div>
        </div>

        <div className="divide-y divide-qtx-border/40">
          {fields.map(({ label, value, mono, color, break: br, link }) => (
            <div key={label} className="px-6 py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0">
              <div className="sm:w-48 text-sm text-slate-500 shrink-0">{label}</div>
              <div className={`text-sm ${mono ? 'font-mono' : ''} ${color || 'text-slate-200'} ${br ? 'break-all' : ''}`}>
                {link ? (
                  <Link href={link} className="hover:underline">{value}</Link>
                ) : value || '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
