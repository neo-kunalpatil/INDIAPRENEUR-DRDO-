import './globals.css';
import WSProvider from '@/components/WSProvider';
import NavBar from '@/components/NavBar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-screen bg-black text-green-500 font-mono overflow-hidden flex flex-col">
        <WSProvider>
          <NavBar />
          <main className="flex-1 overflow-auto">{children}</main>
        </WSProvider>
      </body>
    </html>
  );
}
