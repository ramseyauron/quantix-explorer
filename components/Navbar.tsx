"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (/^\d+$/.test(q)) {
      router.push(`/block/${q}`);
    } else if (/^[0-9a-fA-F]{64}$/.test(q)) {
      router.push(`/address/${q}`);
    } else if (q.length > 20) {
      router.push(`/tx/${encodeURIComponent(q)}`);
    } else {
      router.push(`/block/${q}`);
    }
    setQuery("");
    setMobileOpen(false);
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/txs", label: "Transactions" },
    { href: "/mempool", label: "Mempool" },
    { href: "/validators", label: "Validators" },
  ];

  return (
    <>
      {/* Top stats bar — hidden on mobile */}
      <div className="stats-bar hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="live-dot" />
            <span className="text-qtx-green font-medium">Devnet</span>
          </span>
          <span className="text-qtx-dim">
            Chain ID: <span className="text-qtx-muted">73310</span>
          </span>
          <span className="text-qtx-dim hidden md:inline">
            Consensus: <span className="text-qtx-muted">PBFT+PoS</span>
          </span>
          <span className="text-qtx-dim hidden md:inline">
            Signatures: <span className="text-qtx-muted">SPHINCS+</span>
          </span>
        </div>
      </div>

      {/* Main navbar */}
      <nav className="sticky top-0 z-50 bg-qtx-bg/95 backdrop-blur border-b border-qtx-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <polygon
                points="16,2 30,26 2,26"
                stroke="#06b6d4"
                strokeWidth="2"
                fill="none"
              />
              <polygon
                points="16,8 25,24 7,24"
                fill="rgba(6,182,212,0.12)"
                stroke="#7c3aed"
                strokeWidth="1.5"
              />
              <circle cx="16" cy="17" r="2.5" fill="#06b6d4" />
            </svg>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">
                Quantix
              </span>
              <span className="text-xs text-qtx-dim font-normal hidden sm:block">
                Explorer
              </span>
            </div>
          </Link>

          {/* Nav links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-5">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link text-sm font-medium transition-colors ${
                  pathname === href
                    ? "text-qtx-text"
                    : "text-qtx-dim hover:text-qtx-muted"
                }`}
              >
                {label}
              </Link>
            ))}
            <span
              className="text-sm font-medium text-qtx-dim/50 cursor-not-allowed relative group"
              title="Coming Soon"
            >
              Tokens
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-qtx-surface2 text-qtx-muted text-xs px-2 py-1 rounded border border-qtx-border2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Coming Soon
              </span>
            </span>
          </div>

          {/* Network badge — hidden on mobile and small screens */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-qtx-surface border border-qtx-border2 text-xs shrink-0">
            <span
              className="live-dot"
              style={{ width: "5px", height: "5px" }}
            />
            <span className="text-qtx-muted font-medium">
              Devnet · Chain 73310
            </span>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md ml-auto">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-qtx-dim"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search blocks, txs, addresses..."
                className="w-full bg-qtx-surface border border-qtx-border2 rounded-md pl-9 pr-4 py-2 text-sm text-qtx-text placeholder-qtx-dim focus:outline-none focus:border-qtx-cyan focus:ring-1 focus:ring-qtx-cyan/30 transition-all"
              />
            </div>
          </form>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden shrink-0 p-2 rounded text-qtx-dim hover:text-qtx-text hover:bg-qtx-surface transition-colors"
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-qtx-bg border-b border-qtx-border">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                  pathname === href
                    ? "bg-qtx-surface text-qtx-cyan"
                    : "text-qtx-muted hover:bg-qtx-surface hover:text-qtx-text"
                }`}
              >
                {label}
              </Link>
            ))}
            <span className="px-3 py-2.5 text-sm font-medium text-qtx-dim/50 cursor-not-allowed">
              Tokens{" "}
              <span className="text-xs ml-1 opacity-60">(Coming Soon)</span>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
