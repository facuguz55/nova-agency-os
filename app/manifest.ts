import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nova Agency OS',
    short_name: 'Nova OS',
    description: 'Sistema operativo interno de Nova Agency',
    start_url: '/m',
    display: 'standalone',
    background_color: '#080f1e',
    theme_color: '#080f1e',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
