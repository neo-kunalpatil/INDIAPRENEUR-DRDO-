import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
      <h2 className="text-4xl font-bold text-red-500 tracking-widest">404 - SYSTEM NOT FOUND</h2>
      <p className="text-gray-400">The requested telemetry interface does not exist.</p>
      <Link href="/engine" className="text-blue-500 hover:text-blue-400 border border-blue-900 px-4 py-2 bg-gray-900">RETURN TO ENGINE CORE</Link>
    </div>
  )
}
