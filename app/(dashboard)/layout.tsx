'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import GlobalSearch from '@/components/search/GlobalSearch'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (window.innerWidth < 768) {
      router.replace('/m')
    }
    function handleResize() {
      if (window.innerWidth < 768) router.replace('/m')
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [router])

  return (
    <div className="flex h-screen overflow-hidden bg-[#080f1e]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {children}
      </main>
      <GlobalSearch />
    </div>
  )
}
