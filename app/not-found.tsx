import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl font-bold font-mono text-qtx-cyan mb-4">404</div>
      <h2 className="text-2xl font-bold text-white mb-2">Not Found</h2>
      <p className="text-slate-500 mb-8">The block, transaction, or address you are looking for does not exist.</p>
      <Link href="/" className="px-6 py-2.5 bg-qtx-cyan/10 border border-qtx-cyan/30 text-qtx-cyan rounded-lg hover:bg-qtx-cyan/20 transition-colors">
        ← Back to Explorer
      </Link>
    </div>
  )
}
