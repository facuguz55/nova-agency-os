import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { template: '%s | Nova OS', default: 'Nova Agency OS' },
  description: 'Sistema operativo centralizado de Nova Agency',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nova OS',
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#080f1e',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-[#080f1e] text-[#e2e8f0] antialiased">
        <div id="app-root" className="h-full">{children}</div>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('nova-theme');
            if (t) document.documentElement.dataset.theme = t;
          } catch(e) {}
        `}} />
      </body>
    </html>
  )
}
