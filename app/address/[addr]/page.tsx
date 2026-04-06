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

function shortHash(h: string, front = 8, back = 6) {
  if (!h) return "—";
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
  if (!ts) return "—";
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts * 1000).toLocaleString();
}

interface AddressSummary {
  address: string;
  balance: string | number;
  total_received: string | number;
  total_sent: string | number;
  tx_count: number;
}

interface FlatTx {
  id: string;
  sender: string;
  receiver: string;
  amount: string | number;
  blockHeight: number;
  blockTimestamp: number;
}

export default function AddressPage() {
  const { addr } = useParams<{ addr: string }>();
  const [summary, setSummary] = useState<AddressSummary | null>(null);
  const [txs, setTxs] = useState<FlatTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Fetch address summary
        const sumRes = await fetch(`/api/node/address/${addr}`, {
          cache: "no-store",
        });
        if (sumRes.ok) setSummary(await sumRes.json());

        // Scan all blocks for transactions involving this address
        const countRes = await fetch("/api/node/blockcount", {
          cache: "no-store",
        });
        const { count } = await countRes.json();
        const blockPromises = Array.from({ length: count }, (_, i) =>
          fetch(`/api/node/block/${i}`, { cache: "no-store" })
            .then((r) => r.json())
            .catch(() => null),
        );
        const blocks = (await Promise.all(blockPromises)).filter(Boolean);
        const addrTxs: FlatTx[] = blocks.flatMap((b: any) =>
          (b.body?.txs_list || [])
            .filter((tx: any) => tx.sender === addr || tx.receiver === addr)
            .map((tx: any) => ({
              ...tx,
              blockHeight: b.header.height,
              blockTimestamp: b.header.timestamp,
            })),
        );
        setTxs(addrTxs.reverse());
      } catch {
        /* offline */
      }
      setLoading(false);
    }
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [addr]);

  const copyAddr = () => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading)
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-qtx-surface rounded w-32" />
        <div className="qtx-card h-32" />
        <div className="qtx-card h-48" />
      </div>
    );

  const balance = summary?.balance ?? 0;
  const received = summary?.total_received ?? 0;
  const sent = summary?.total_sent ?? 0;
  const txCount = summary?.tx_count ?? txs.length;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-qtx-dim">
        <Link href="/" className="hover:text-qtx-cyan">
          Home
        </Link>
        <span>›</span>
        <span className="text-qtx-muted">Address</span>
      </div>

      <h1 className="text-xl font-bold text-white">Address Details</h1>

      {/* Address card */}
      <div className="qtx-card p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, rgba(6,182,212,0.2), rgba(124,58,237,0.2))`,
              border: "1px solid rgba(6,182,212,0.2)",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-qtx-dim uppercase tracking-wide mb-1 font-medium">
              Address
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm text-qtx-cyan break-all leading-relaxed">
                {fmtAddr(addr)}
              </code>
              <button onClick={copyAddr} className="copy-btn shrink-0">
                {copied ? (
                  <>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>{" "}
                    Copied
                  </>
                ) : (
                  <>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>{" "}
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "QTX Balance",
            value: formatQTX(balance),
            color: "text-qtx-cyan",
            icon: "◈",
          },
          {
            label: "Total Received",
            value: formatQTX(received),
            color: "text-qtx-green",
            icon: "↙",
          },
          {
            label: "Total Sent",
            value: formatQTX(sent),
            color: "text-red-400",
            icon: "↗",
          },
          {
            label: "Transactions",
            value: txCount.toLocaleString(),
            color: "text-qtx-purple-light",
            icon: "⇄",
          },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="stat-card">
            <div className="text-xs text-qtx-dim uppercase tracking-wide mb-2 font-medium">
              {icon} {label}
            </div>
            <div className={`text-base font-bold font-mono ${color}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-qtx-border">
        <button className="tab-btn active">Transactions ({txCount})</button>
      </div>

      {/* Transactions table */}
      <div className="qtx-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="qtx-table">
            <thead>
              <tr>
                <th>Tx Hash</th>
                <th className="hidden sm:table-cell">Block</th>
                <th className="hidden md:table-cell">Age</th>
                <th>From</th>
                <th className="hidden md:table-cell">To</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {txs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-qtx-dim text-sm"
                  >
                    No transactions found for this address
                  </td>
                </tr>
              ) : (
                txs.map((tx, i) => (
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
                        href={`/block/${tx.blockHeight}`}
                        className="text-xs text-qtx-muted hover:text-qtx-cyan font-mono"
                      >
                        #{tx.blockHeight}
                      </Link>
                    </td>
                    <td className="hidden md:table-cell text-xs text-qtx-dim">
                      {timeAgo(tx.blockTimestamp)}
                    </td>
                    <td>
                      {tx.sender === addr ? (
                        <span className="font-mono text-xs bg-qtx-surface2 text-qtx-dim px-2 py-0.5 rounded">
                          Self
                        </span>
                      ) : (
                        <Link
                          href={`/address/${tx.sender}`}
                          className="font-mono text-xs text-qtx-muted hover:text-qtx-cyan"
                        >
                          {shortHash(tx.sender, 8, 6)}
                        </Link>
                      )}
                    </td>
                    <td className="hidden md:table-cell">
                      {tx.receiver === addr ? (
                        <span className="font-mono text-xs bg-qtx-surface2 text-qtx-dim px-2 py-0.5 rounded">
                          Self
                        </span>
                      ) : (
                        <Link
                          href={`/address/${tx.receiver}`}
                          className="font-mono text-xs text-qtx-muted hover:text-qtx-cyan"
                        >
                          {shortHash(tx.receiver, 8, 6)}
                        </Link>
                      )}
                    </td>
                    <td>
                      <span
                        className={`font-mono text-xs font-medium ${tx.receiver === addr ? "text-qtx-green" : "text-red-400"}`}
                      >
                        {tx.receiver === addr ? "+" : "-"}
                        {formatQTX(tx.amount)}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success">Success</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
