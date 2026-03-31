import { getNodeStatus, getAllBlocks, shortHash, timeAgo } from '@/lib/api'
import Link from 'next/link'

export const revalidate = 0

export default async function HomePage() {
  const [status, blocks] = await Promise.all([
    getNodeStatus(),
    getAllBlocks(),
  ])

  const isOnline = !!status
  const blockCount = status?.blockchain_info.block_count ?? 0
  const totalTxs = blocks.reduce((s, b) => s + (b.body?.txs_list?.length || 0), 0)
  const genesisHash = status?.blockchain_info.genesis_block_hash ?? ''

  return (
    <div className="space-y-8">
      {/* Network Banner */}
      <div className="rounded-2xl border border-qtx-border bg-gradient-to-br from-qtx-surface to-qtx-bg p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-qtx-green blink' : 'bg-qtx-red'}`}/>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                {isOnline ? 'Network Online' : 'Node Offline'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">Quantix Devnet</h1>
            <p className="text-slate-500 text-sm mt-0.5">Chain ID: 73310 · Post-Quantum Layer 1</p>
          </div>
          <div className="flex gap-6">
            {[
              { label: 'Total Blocks', value: blockCount.toLocaleString(), color: 'text-qtx-cyan' },
              { label: 'Total Txns', value: totalTxs.toLocaleString(), color: 'text-qtx-purple' },
              { label: 'Consensus', value: 'PBFT + PoS', color: 'text-qtx-green' },
              { label: 'Block Time', value: '10s', color: 'text-qtx-yellow' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {genesisHash && (
          <div className="mt-4 pt-4 border-t border-qtx-border">
            <span className="text-xs text-slate-500">Genesis Hash: </span>
            <span className="font-mono text-xs text-qtx-cyan break-all">{genesisHash}</span>
          </div>
        )}
      </div>

      {/* Blocks Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Latest Blocks</h2>
          <span className="text-xs text-slate-500">{blockCount} total</span>
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
                <th className="px-4 py-3 text-left text-slate-500 font-medium hidden xl:table-cell">Miner / Validator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-qtx-border/50">
              {blocks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-600">
                    {isOnline ? 'No blocks found' : '⚡ Node offline — connect a Quantix devnet node at http://127.0.0.1:8560'}
                  </td>
                </tr>
              ) : blocks.map((block) => {
                const h = block.header
                const txCount = block.body?.txs_list?.length || 0
                return (
                  <tr key={h.height} className="hover:bg-qtx-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/block/${h.height}`}
                        className="text-qtx-cyan hover:underline font-mono font-semibold">
                        #{h.height}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                      {timeAgo(h.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                        txCount > 0
                          ? 'bg-qtx-cyan/10 text-qtx-cyan border border-qtx-cyan/20'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {txCount} tx
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Link href={`/block/${h.height}`}
                        className="font-mono text-xs text-slate-400 hover:text-qtx-cyan transition-colors">
                        {shortHash(h.hash)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-slate-600">
                        {shortHash(h.parent_hash)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="font-mono text-xs text-slate-500">
                        {h.proposer_id ? shortHash(h.proposer_id, 12) : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Node offline hint */}
      {!isOnline && (
        <div className="rounded-xl border border-qtx-yellow/30 bg-qtx-yellow/5 p-4 text-sm text-qtx-yellow">
          <strong>⚡ Demo Mode</strong> — No live node detected. Start a Quantix devnet node locally:
          <pre className="mt-2 text-xs font-mono text-slate-400 bg-qtx-bg p-2 rounded overflow-x-auto">
{`./quantix -nodes 1 -node-index 0 -roles validator \\
  -datadir /tmp/qtx \\
  -http-port 127.0.0.1:8560 \\
  -udp-port 32421 -tcp-addr 127.0.0.1:32421`}
          </pre>
        </div>
      )}
    </div>
  )
}
