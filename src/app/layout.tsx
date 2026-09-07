import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'WEBECK', description: '触れる、回す、夢中になる。WEBECK — an interactive experiment.' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="ja"><body>{children}</body></html>;
}
