import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-screen bg-black text-green-500 font-mono overflow-hidden flex flex-col">
        <nav className="p-3 border-b border-blue-900 flex space-x-4 bg-gray-950 text-xs">
          <div className="font-bold text-blue-500 mr-4">MALE UAV GCS</div>
          <Link href="/engine" className="hover:text-white">Engine</Link>
          <Link href="/environment" className="hover:text-white">Environment</Link>
          <Link href="/mission" className="hover:text-white">Mission</Link>
          <Link href="/faults" className="hover:text-white">Faults</Link>
          <Link href="/health" className="hover:text-white">Health</Link>
          <Link href="/analytics" className="hover:text-white">AI Analytics</Link>
          <Link href="/telemetry" className="hover:text-white">Telemetry</Link>
        </nav>
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
