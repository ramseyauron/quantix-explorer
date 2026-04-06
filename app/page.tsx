"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Block {
  header: {
    hash: string;
    height: number;
    timestamp: number;
    parent_hash: string;
    txs_root: string;
    state_root: string;
    proposer_id: string;
    miner: string;
    nonce: string;
    gas_limit: string | number;
    gas_used: string | number;
    difficulty: string;
    commit_status: string;
  };
  body: { txs_list: Tx[] };
}

interface Tx {
  id: string;
  sender: string;
  receiver: string;
  amount: string | number;
  nonce: number;
  gas_limit: string | number;
  gas_price?: string | number;
  timestamp: number;
  signature?: string;
}

interface BlockchainInfo {
  block_count: number;
  best_block_hash: string;
  genesis_block_hash: string;
  synced?: boolean;
}

function shortHash(h: string, front = 8, back = 6) {
  if (!h) return "—";
  if (h.startsWith("GENESIS_")) return h.slice(0, 14) + "…";
  if (h.length <= front + back + 3) return h;
  return h.slice(0, front) + "…" + h.slice(-back);
}

function formatQTX(a: string | number) {
  try {
    const n = BigInt(a.toString());
    if (n === 0n) return "0 QTX";
    const qtx = Number(n) / 1e18;
    if (qtx < 0.000001) return `${n.toLocaleString()} nQTX`;
    return (
      qtx.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
      }) + " QTX"
    );
  } catch {
    return `${a}`;
  }
}

function timeAgo(ts: number) {
  if (!ts || ts < 1_000_000) return "—";
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="px-4 py-4 flex flex-col gap-1 min-w-0">
      <div className="text-xs text-qtx-dim uppercase tracking-wide font-medium truncate">
        {label}
      </div>
      <div className="text-base sm:text-lg font-bold text-qtx-text font-mono truncate">
        {value}
      </div>
      {sub && <div className="text-xs text-qtx-dim truncate">{sub}</div>}
    </div>
  );
}

export default function HomePage() {
  const [info, setInfo] = useState<BlockchainInfo | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [query, setQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [infoRes, countRes] = await Promise.all([
        fetch("/api/node/", { cache: "no-store" }),
        fetch("/api/node/blockcount", { cache: "no-store" }),
      ]);
      if (!infoRes.ok) {
        setOnline(false);
        setLoading(false);
        return;
      }
      const infoData = await infoRes.json();
      const { count } = await countRes.json();

      setInfo(infoData.blockchain_info);
      setOnline(true);

      // Fetch latest 20 blocks
      const start = Math.max(0, count - 20);
      const promises = Array.from({ length: count - start }, (_, i) =>
        fetch(`/api/node/block/${start + i}`, { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
      );
      const fetched = (await Promise.all(promises)).filter(Boolean) as Block[];
      setBlocks(fetched.reverse());
      setLastUpdated(new Date());
    } catch {
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 15000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const allTxs = blocks.flatMap((b) =>
    (b.body?.txs_list || []).map((tx) => ({
      ...tx,
      blockHeight: b.header.height,
      blockTimestamp: b.header.timestamp,
    })),
  );
  const totalTxs = allTxs.length;
  const blockCount = info?.block_count ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (/^\d+$/.test(q)) window.location.href = `/block/${q}`;
    else if (/^[0-9a-fA-F]{64}$/.test(q))
      window.location.href = `/address/${q}`;
    else if (q.length > 20)
      window.location.href = `/tx/${encodeURIComponent(q)}`;
  };

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
      {/* Hero / Search section */}
      <div className="search-hero px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 mx-4">
              Quantix Blockchain Explorer
            </h1>
            <p className="text-qtx-dim text-sm hidden sm:block mx-4">
              Post-quantum Layer 1 · SPHINCS+ · Devnet · Chain ID 73310
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex max-w-2xl mx-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search blocks, txs, addresses..."
              className="flex-1 bg-white/5 border border-qtx-border2 border-r-0 rounded-l-lg px-4 sm:px-5 py-2.5 sm:py-3 text-sm text-qtx-text placeholder-qtx-dim focus:outline-none focus:border-qtx-cyan focus:ring-1 focus:ring-qtx-cyan/30 transition-all min-w-0"
            />
            <button
              type="submit"
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-qtx-cyan text-black text-sm font-semibold rounded-r-lg hover:bg-qtx-cyan-light transition-colors shrink-0"
            >
              Search
            </button>
          </form>
          <p className="text-xs text-qtx-dim mt-2 hidden sm:block">
            Supported: Block Height (number), Tx Hash (long string), Address
            (64-char hex)
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-qtx-surface border-b border-qtx-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {/* Card 1 — mobile: right + bottom borders; sm: right only */}
            <div className="border-r border-b sm:border-b-0 border-qtx-border">
              <StatCard
                label="Block Height"
                value={blockCount > 0 ? `#${blockCount.toLocaleString()}` : "—"}
                sub="latest block"
              />
            </div>
            {/* Card 2 — mobile: bottom border only; sm: right + no bottom */}
            <div className="border-b sm:border-b-0 sm:border-r border-qtx-border">
              <StatCard
                label="Transactions"
                value={totalTxs > 0 ? totalTxs.toLocaleString() : "—"}
                sub="across all blocks"
              />
            </div>
            {/* Card 3 — mobile: right border only; sm: right only */}
            <div className="border-r border-qtx-border">
              <StatCard
                label="Avg Block Time"
                value="~10s"
                sub="PBFT+PoS consensus"
              />
            </div>
            {/* Card 4 — no borders (last in both layouts) */}
            <div>
              <StatCard
                label="Network"
                value={online ? "Online" : loading ? "..." : "Offline"}
                sub={online ? "Devnet · Synced" : "Node unreachable"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {lastUpdated && (
          <div className="text-xs text-qtx-dim mb-3 text-right">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[0, 1].map((i) => (
              <div key={i} className="qtx-card animate-pulse">
                <div className="p-4 border-b border-qtx-border h-12 bg-qtx-surface2" />
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="px-4 py-3 border-b border-qtx-border">
                    <div className="h-4 bg-qtx-surface2 rounded w-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : !online ? (
          <div className="qtx-card p-16 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Node Offline
            </h2>
            <p className="text-qtx-dim text-sm">
              Unable to connect to the Quantix node at 164.68.118.17:8560
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest Blocks */}
            <div className="qtx-card">
              <div className="flex items-center justify-between px-4 py-3 border-b border-qtx-border bg-qtx-surface">
                <h2 className="font-semibold text-qtx-text text-sm">
                  Latest Blocks
                </h2>
                <span className="flex items-center gap-1.5 text-xs text-qtx-dim">
                  <span className="live-dot" />
                  Live
                </span>
              </div>
              <div>
                {blocks.length === 0 ? (
                  <div className="p-8 text-center text-qtx-dim text-sm">
                    No blocks yet
                  </div>
                ) : (
                  blocks.slice(0, 10).map((b) => {
                    const txCount = b.body?.txs_list?.length || 0;
                    const proposer =
                      b.header.proposer_id || b.header.miner || "";
                    return (
                      <div
                        key={b.header.height}
                        className="flex items-center gap-3 px-4 py-3 border-b border-qtx-border last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Block icon */}
                        <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-qtx-surface2 border border-qtx-border2 flex flex-col items-center justify-center">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="1.5"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M3 9h18M9 21V9" />
                          </svg>
                        </div>
                        {/* Block info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <Link
                              href={`/block/${b.header.height}`}
                              className="text-qtx-cyan font-mono font-semibold text-sm hover:text-qtx-cyan-light"
                            >
                              #{b.header.height}
                            </Link>
                            <span className="text-xs text-qtx-dim">
                              {timeAgo(b.header.timestamp)}
                            </span>
                          </div>
                          {proposer && (
                            <div className="text-xs text-qtx-dim mt-0.5 truncate">
                              Proposer:{" "}
                              <span className="font-mono text-qtx-muted">
                                {shortHash(proposer, 8, 6)}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Tx count + reward */}
                        <div className="text-right shrink-0">
                          <div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${txCount > 0 ? "bg-qtx-cyan/10 text-qtx-cyan border border-qtx-cyan/20" : "bg-qtx-surface2 text-qtx-dim border border-qtx-border2"}`}
                            >
                              {txCount} txn{txCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="text-xs text-qtx-dim mt-1">5 QTX</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-3 border-t border-qtx-border bg-qtx-surface">
                <Link
                  href="/"
                  className="text-xs text-qtx-cyan hover:text-qtx-cyan-light font-medium"
                >
                  View all blocks →
                </Link>
              </div>
            </div>

            {/* Latest Transactions */}
            <div className="qtx-card">
              <div className="flex items-center justify-between px-4 py-3 border-b border-qtx-border bg-qtx-surface">
                <h2 className="font-semibold text-qtx-text text-sm">
                  Latest Transactions
                </h2>
                <span className="flex items-center gap-1.5 text-xs text-qtx-dim">
                  <span className="live-dot" />
                  Live
                </span>
              </div>
              <div>
                {allTxs.length === 0 ? (
                  <div className="p-8 text-center text-qtx-dim text-sm">
                    No transactions yet
                  </div>
                ) : (
                  allTxs.slice(0, 10).map((tx, i) => (
                    <div
                      key={`${tx.id}-${i}`}
                      className="flex items-center gap-3 px-4 py-3 border-b border-qtx-border last:border-b-0 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Tx icon */}
                      <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-qtx-surface2 border border-qtx-border2 flex items-center justify-center">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#7c3aed"
                          strokeWidth="1.5"
                        >
                          <path d="M7 16L3 12l4-4M17 8l4 4-4 4M14 4l-4 16" />
                        </svg>
                      </div>
                      {/* Tx info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/tx/${encodeURIComponent(tx.id)}`}
                            className="text-qtx-cyan font-mono text-xs hover:text-qtx-cyan-light truncate max-w-[120px] sm:max-w-[150px]"
                          >
                            {shortHash(tx.id, 10, 6)}
                          </Link>
                          <span className="badge badge-method shrink-0 hidden sm:inline-flex">
                            Transfer
                          </span>
                        </div>
                        <div className="text-xs text-qtx-dim mt-0.5 truncate">
                          Block{" "}
                          <Link
                            href={`/block/${(tx as any).blockHeight}`}
                            className="text-qtx-muted hover:text-qtx-cyan"
                          >
                            #{(tx as any).blockHeight}
                          </Link>
                          {" · "}
                          {timeAgo((tx as any).blockTimestamp || tx.timestamp)}
                        </div>
                      </div>
                      {/* From/To + Amount */}
                      <div className="text-right shrink-0">
                        <div className="text-xs text-qtx-dim hidden sm:block">
                          <span className="font-mono">
                            {shortHash(tx.sender, 6, 4)}
                          </span>
                          {" → "}
                          <span className="font-mono">
                            {shortHash(tx.receiver, 6, 4)}
                          </span>
                        </div>
                        <div className="text-xs text-qtx-green font-mono font-medium">
                          {formatQTX(tx.amount)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 border-t border-qtx-border bg-qtx-surface">
                <Link
                  href="/txs"
                  className="text-xs text-qtx-cyan hover:text-qtx-cyan-light font-medium"
                >
                  View all transactions →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
