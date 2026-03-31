import { getAllBlocks, shortHash, formatAmount, timeAgo } from '@/lib/api'
import Link from 'next/link'

export const revalidate = 0

export default async function TxsPage() {
  const blocks = await getAllBlocks()
  const allTxs = blocks.flatMap(b =>
    (b.body?.txs_list || []).map(tx => ({
      ...tx,
      blockHeight: b.header.height,
      blockTimestamp: b.header.timestamp,
    }))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">{allTxs.length} transactions found</p>
        </div>
      </div>

      <div className="rounded-xl border border-qtx-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-qtx-surface border-b border-qtx-border">
              <th className="px-4 py-3 text-left text-slate-500 font-medium">Tx Hash</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium hidden sm:table-cell">Block</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium hidden md:table-cell">Age</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium">From</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium hidden md:table-cell">To</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-qtx-border/40">
            {allTxs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-600">
                  No transactions found. Start a Quantix node and send some transactions.
                </td>
              </tr>
            ) : allTxs.map((tx, i) => (
              <tr key={`${tx.id}-${i}`} className="hover:bg-qtx-surface/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/tx/${encodeURIComponent(tx.id || '')}`}
                    className="font-mono text-xs text-qtx-cyan hover:underline">
                    {shortHash(tx.id || '', 14)}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <Link href={`/block/${tx.blockHeight}`}
                    className="text-xs text-slate-400 hover:text-qtx-cyan transition-colors">
                    #{tx.blockHeight}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">
                  {timeAgo(tx.blockTimestamp)}
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-slate-400">{shortHash(tx.sender, 10)}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="font-mono text-xs text-slate-400">{shortHash(tx.receiver, 10)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-qtx-green">{formatAmount(tx.amount)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
