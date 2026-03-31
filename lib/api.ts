// Quantix Node API client
// Connects to a running Quantix devnet node

const NODE_URL = process.env.NEXT_PUBLIC_NODE_URL || 'http://127.0.0.1:8560'

export interface BlockHeader {
  hash: string
  height: number
  block: number
  timestamp: number
  difficulty: string
  nonce: string
  txs_root: string
  state_root: string
  parent_hash: string
  uncles_hash: string
  extra_data: string
  miner: string
  gas_limit: string
  gas_used: string
  proposer_id: string
  version: number
}

export interface Transaction {
  id: string
  sender: string
  receiver: string
  amount: string | number
  gas_limit: string | number
  gas_price: string | number
  nonce: number
  timestamp: number
  signature: string
}

export interface Block {
  header: BlockHeader
  body: {
    txs_list: Transaction[]
    uncles: unknown[]
  }
}

export interface NodeStatus {
  message: string
  blockchain_info: {
    block_count: number
    best_block_hash: string
    genesis_block_hash: string
    genesis_block_height: number
  }
  last_transaction: unknown
  available_endpoints: string[]
}

export async function getNodeStatus(): Promise<NodeStatus | null> {
  try {
    const res = await fetch(`${NODE_URL}/`, { next: { revalidate: 5 } })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function getBlockCount(): Promise<number> {
  try {
    const res = await fetch(`${NODE_URL}/blockcount`, { next: { revalidate: 5 } })
    if (!res.ok) return 0
    const data = await res.json()
    return data.count || 0
  } catch { return 0 }
}

export async function getBestBlockHash(): Promise<string> {
  try {
    const res = await fetch(`${NODE_URL}/bestblockhash`, { next: { revalidate: 5 } })
    if (!res.ok) return ''
    const data = await res.json()
    return data.hash || ''
  } catch { return '' }
}

export async function getBlock(id: number): Promise<Block | null> {
  try {
    const res = await fetch(`${NODE_URL}/block/${id}`, { next: { revalidate: 30 } })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function getLatestTransaction(): Promise<Transaction | null> {
  try {
    const res = await fetch(`${NODE_URL}/latest-transaction`, { next: { revalidate: 5 } })
    if (!res.ok) return null
    const data = await res.json()
    if (data.message) return null
    return data
  } catch { return null }
}

export async function getAllBlocks(): Promise<Block[]> {
  const count = await getBlockCount()
  const blocks: Block[] = []
  for (let i = 0; i < Math.min(count, 20); i++) {
    const b = await getBlock(i)
    if (b) blocks.push(b)
  }
  return blocks.reverse()
}

export function shortHash(hash: string, len = 16): string {
  if (!hash) return '—'
  const clean = hash.replace(/^GENESIS_/, 'GENESIS_')
  if (clean.startsWith('GENESIS_')) return clean.slice(0, 20) + '...'
  return clean.slice(0, len) + '...' + clean.slice(-8)
}

export function formatAmount(amount: string | number): string {
  try {
    const n = BigInt(amount.toString())
    const qtx = Number(n) / 1e18
    if (qtx === 0) return '0 QTX'
    if (qtx < 0.001) return `${n.toString()} nQTX`
    return `${qtx.toLocaleString('en-US', { maximumFractionDigits: 4 })} QTX`
  } catch {
    return `${amount} QTX`
  }
}

export function formatTimestamp(ts: number): string {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function timeAgo(ts: number): string {
  if (!ts) return '—'
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
