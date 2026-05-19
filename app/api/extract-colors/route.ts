import { NextResponse } from 'next/server'

const SKIP = new Set([
  '#000000','#ffffff','#111111','#222222','#333333','#444444',
  '#555555','#666666','#777777','#888888','#999999','#aaaaaa',
  '#bbbbbb','#cccccc','#dddddd','#eeeeee','#f0f0f0','#e0e0e0',
])

function isGrayish(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min < 20 // near-gray
}

function extractFromHtml(html: string): string[] {
  const counts: Record<string, number> = {}
  const hexRegex = /#([0-9a-fA-F]{6})\b/g
  let match: RegExpExecArray | null

  while ((match = hexRegex.exec(html)) !== null) {
    const color = `#${match[1].toLowerCase()}`
    if (SKIP.has(color) || isGrayish(color)) continue
    counts[color] = (counts[color] || 0) + 1
  }

  // Theme-color meta tag gets priority
  const themeMatch = html.match(/theme-color["'][^>]*content=["']([#][0-9a-fA-F]{6})["']/i)
    || html.match(/content=["']([#][0-9a-fA-F]{6})["'][^>]*theme-color/i)

  const sorted = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([c]) => c)

  if (themeMatch?.[1]) sorted.unshift(themeMatch[1].toLowerCase())

  return [...new Set(sorted)].slice(0, 6)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  let url = searchParams.get('url') ?? ''
  if (!url) return NextResponse.json({ error: 'url requerida' }, { status: 400 })
  if (!url.startsWith('http')) url = `https://${url}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()
    const colors = extractFromHtml(html)
    return NextResponse.json({ colors })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
