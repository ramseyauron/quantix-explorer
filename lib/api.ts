// Quantix Node API — server-side fetches go direct to node,
// client-side fetches go through the /api/node proxy (avoids CORS).

const DIRECT_URL = process.env.NODE_URL || 'http://164.68.118.17:8560'

// On server: fetch directly. On client (browser): use the /api/node proxy.
function nodeUrl(path: string): string {
  if (typeof window === 'undefined') {
    return `${DIRECT_URL}/${path}`
  }
  return `/api/node/${path}`
}

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

async function fetchNode<T>(path: string, revalidate = 10): Promise<T | null> {
  try {
    const url = nodeUrl(path)
    const res = await fetch(url, {
      next: { revalidate },
      cache: revalidate === 0 ? 'no-store' : 'default',
    })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function getNodeStatus(): Promise<NodeStatus | null> {
  return fetchNode<NodeStatus>('', 5)
}

export async function getBlockCount(): Promise<number> {
  const data = await fetchNode<{ count: number }>('blockcount', 5)
  return data?.count ?? 0
}

export async function getBestBlockHash(): Promise<string> {
  const data = await fetchNode<{ hash: string }>('bestblockhash', 5)
  return data?.hash ?? ''
}

export async function getBlock(id: number): Promise<Block | null> {
  return fetchNode<Block>(`block/${id}`, 30)
}

export async function getLatestTransaction(): Promise<Transaction | null> {
  const data = await fetchNode<Transaction | { message: string }>('latest-transaction', 5)
  if (!data || 'message' in data) return null
  return data as Transaction
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
  if (hash.startsWith('GENESIS_')) return hash.slice(0, 20) + '...'
  return hash.slice(0, len) + '...' + hash.slice(-8)
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
