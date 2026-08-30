"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/engine', label: 'Engine' },
  { href: '/environment', label: 'Environment' },
  { href: '/mission', label: 'Mission' },
  { href: '/faults', label: 'Faults' },
  { href: '/health', label: 'Health' },
  { href: '/analytics', label: 'AI Analytics' },
  { href: '/telemetry', label: 'Telemetry' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="p-3 border-b border-blue-900 flex space-x-2 bg-gray-950 text-xs flex-shrink-0 items-center">
      <div className="font-bold text-blue-500 mr-4 tracking-wider">MALE UAV GCS</div>
      <div className="flex space-x-1">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || (pathname === '/' && link.href === '/engine');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded transition-all font-semibold ${
                isActive
                  ? 'bg-blue-900/60 text-white border border-blue-500 shadow-sm shadow-blue-500/20'
                  : 'text-green-400 hover:text-white hover:bg-gray-800/80 border border-transparent'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
