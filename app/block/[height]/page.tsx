"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

function fmtAddr(h: string) {
  if (!h) return "—";
  return h
    .toUpperCase()
    .match(/.{1,4}/g)!
    .join(" ");
}

function shortHash(h: string, front = 10, back = 8) {
  if (!h) return "—";
  if (h.startsWith("GENESIS_")) return h.slice(0, 18) + "…";
  if (h.length <= front + back + 3) return h.toUpperCase();
  return (h.slice(0, front) + "…" + h.slice(-back)).toUpperCase();
}

function formatQTX(a: string | number) {
  try {
    const n = BigInt(a.toString());
    if (n === 0n) return "0 QTX";
    const qtx = Number(n) / 1e18;
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
  if (s < 60) return `${s} secs ago`;
  if (s < 3600) return `${Math.floor(s / 60)} mins ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hrs ago`;
  return new Date(ts * 1000).toLocaleString();
}

function formatTimestamp(ts: number) {
  if (!ts || ts < 1_000_000) return "—";
  return new Date(ts * 1000).toUTCString();
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="detail-row">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{children}</div>
    </div>
  );
}

export default function BlockPage() {
  const { height } = useParams<{ height: string }>();
  const [block, setBlock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "txs">("overview");

  useEffect(() => {
    fetch(`/api/node/block/${height}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setBlock)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [height]);

  if (loading)
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 bg-qtx-surface rounded w-64" />
        <div className="qtx-card">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="detail-row">
              <div className="h-4 bg-qtx-surface2 rounded w-32" />
              <div className="h-4 bg-qtx-surface2 rounded w-64" />
            </div>
          ))}
        </div>
      </div>
    );

  if (error || !block)
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-white mb-2">Block Not Found</h2>
        <p className="text-qtx-muted mb-6 text-sm">
          Block #{height} does not exist or node is offline.
        </p>
        <Link href="/" className="text-qtx-cyan hover:underline text-sm">
          ← Back to Explorer
        </Link>
      </div>
    );

  const h = block.header;
  const txs: any[] = block.body?.txs_list || [];
  const heightNum = parseInt(height);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-qtx-dim">
        <Link href="/" className="hover:text-qtx-cyan">
          Home
        </Link>
        <span>›</span>
        <Link href="/" className="hover:text-qtx-cyan">
          Blocks
        </Link>
        <span>›</span>
        <span className="text-qtx-muted">Block #{h.height}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">
          Block <span className="text-qtx-cyan font-mono">#{h.height}</span>
        </h1>
        <div className="flex gap-2 flex-wrap">
          {heightNum > 0 && (
            <Link
              href={`/block/${heightNum - 1}`}
              className="px-3 py-1.5 min-h-[36px] text-xs border border-qtx-border2 rounded bg-qtx-surface text-qtx-muted hover:border-qtx-cyan hover:text-qtx-cyan transition-colors flex items-center"
            >
              ← Prev
            </Link>
          )}
          <Link
            href={`/block/${heightNum + 1}`}
            className="px-3 py-1.5 min-h-[36px] text-xs border border-qtx-border2 rounded bg-qtx-surface text-qtx-muted hover:border-qtx-cyan hover:text-qtx-cyan transition-colors flex items-center"
          >
            Next →
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-qtx-border flex gap-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("txs")}
          className={`tab-btn ${activeTab === "txs" ? "active" : ""}`}
        >
          Transactions{" "}
          <span
            className={`ml-1.5 px-1.5 py-0.5 rounded text-xs font-mono ${txs.length > 0 ? "bg-qtx-cyan/10 text-qtx-cyan" : "bg-qtx-surface2 text-qtx-dim"}`}
          >
            {txs.length}
          </span>
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="qtx-card">
          <Row label="Block Height">
            <span className="font-mono text-qtx-cyan">#{h.height}</span>
          </Row>
          <Row label="Status">
            <span className="badge badge-success">✓ Finalized</span>
          </Row>
          <Row label="Timestamp">
            <span>{formatTimestamp(h.timestamp)}</span>
            <span className="text-qtx-dim ml-2 text-xs">
              ({timeAgo(h.timestamp)})
            </span>
          </Row>
          <Row label="Transactions">
            <Link
              href="#"
              onClick={() => setActiveTab("txs")}
              className="text-qtx-cyan hover:underline"
            >
              {txs.length} transaction{txs.length !== 1 ? "s" : ""} in this
              block
            </Link>
          </Row>
          <Row label="Proposed By">
            {h.proposer_id ? (
              <Link
                href={`/address/${h.proposer_id}`}
                className="font-mono text-qtx-cyan hover:underline text-sm break-all leading-relaxed"
              >
                {fmtAddr(h.proposer_id)}
              </Link>
            ) : (
              <span className="text-qtx-dim">—</span>
            )}
          </Row>
          <Row label="Block Reward">
            <span className="text-qtx-green font-mono">5 QTX</span>
          </Row>
          <Row label="Gas Used">
            <span className="font-mono">
              {h.gas_used !== undefined
                ? Number(h.gas_used).toLocaleString()
                : "—"}
            </span>
            {h.gas_limit && h.gas_used !== undefined && (
              <span className="text-qtx-dim text-xs ml-2">
                ({Math.round((Number(h.gas_used) / Number(h.gas_limit)) * 100)}
                %)
              </span>
            )}
          </Row>
          <Row label="Gas Limit">
            <span className="font-mono">
              {h.gas_limit !== undefined
                ? Number(h.gas_limit).toLocaleString()
                : "—"}
            </span>
          </Row>
          <Row label="Block Hash">
            <span className="font-mono text-sm break-all text-qtx-muted">
              {h.hash || "—"}
            </span>
          </Row>
          <Row label="Parent Hash">
            {h.parent_hash ? (
              <Link
                href={`/block/${heightNum - 1}`}
                className="font-mono text-sm text-qtx-cyan hover:underline break-all"
              >
                {h.parent_hash}
              </Link>
            ) : (
              <span className="text-qtx-dim">—</span>
            )}
          </Row>
          <Row label="State Root">
            <span className="font-mono text-sm break-all text-qtx-muted">
              {h.state_root || "—"}
            </span>
          </Row>
          <Row label="Transactions Root">
            <span className="font-mono text-sm break-all text-qtx-muted">
              {h.txs_root || "—"}
            </span>
          </Row>
          <Row label="Nonce">
            <span className="font-mono text-qtx-muted">{h.nonce || "—"}</span>
          </Row>
          <Row label="Difficulty">
            <span className="font-mono text-qtx-muted">
              {h.difficulty || "—"}
            </span>
          </Row>
        </div>
      )}

      {activeTab === "txs" && (
        <div className="qtx-card overflow-hidden">
          {txs.length === 0 ? (
            <div className="p-12 text-center text-qtx-dim text-sm">
              No transactions in this block
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="qtx-table">
                <thead>
                  <tr>
                    <th>Tx Hash</th>
                    <th className="hidden sm:table-cell">From</th>
                    <th className="hidden sm:table-cell">To</th>
                    <th>Value</th>
                    <th className="hidden lg:table-cell">Gas Limit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((tx: any, i: number) => (
                    <tr key={`${tx.id}-${i}`}>
                      <td>
                        <Link
                          href={`/tx/${encodeURIComponent(tx.id)}`}
                          className="font-mono text-xs text-qtx-cyan hover:underline"
                        >
                          {shortHash(tx.id, 10, 6)}
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell">
                        <Link
                          href={`/address/${tx.sender}`}
                          className="font-mono text-xs text-qtx-muted hover:text-qtx-cyan"
                        >
                          {shortHash(tx.sender, 8, 6)}
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell">
                        <Link
                          href={`/address/${tx.receiver}`}
                          className="font-mono text-xs text-qtx-muted hover:text-qtx-cyan"
                        >
                          {shortHash(tx.receiver, 8, 6)}
                        </Link>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-qtx-green">
                          {formatQTX(tx.amount)}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="font-mono text-xs text-qtx-dim">
                          {tx.gas_limit?.toLocaleString() || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-success">Success</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
