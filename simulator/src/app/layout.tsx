import './globals.css';
import Link from 'next/link';
import WSProvider from '@/components/WSProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-screen bg-black text-green-500 font-mono overflow-hidden flex flex-col">
        <WSProvider>
          <nav className="p-3 border-b border-blue-900 flex space-x-4 bg-gray-950 text-xs flex-shrink-0">
            <div className="font-bold text-blue-500 mr-4">MALE UAV GCS</div>
            <Link href="/engine"      className="hover:text-white transition-colors">Engine</Link>
            <Link href="/environment" className="hover:text-white transition-colors">Environment</Link>
            <Link href="/mission"     className="hover:text-white transition-colors">Mission</Link>
            <Link href="/faults"      className="hover:text-white transition-colors">Faults</Link>
            <Link href="/health"      className="hover:text-white transition-colors">Health</Link>
            <Link href="/analytics"   className="hover:text-white transition-colors">AI Analytics</Link>
            <Link href="/telemetry"   className="hover:text-white transition-colors">Telemetry</Link>
          </nav>
          <main className="flex-1 overflow-auto">{children}</main>
        </WSProvider>
      </body>
    </html>
  );
}
