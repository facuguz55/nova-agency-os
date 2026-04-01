import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nova Agency OS',
  description: 'Sistema operativo centralizado de Nova Agency',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-[#0f172a] text-[#e2e8f0] antialiased">{children}</body>
    </html>
  )
}
