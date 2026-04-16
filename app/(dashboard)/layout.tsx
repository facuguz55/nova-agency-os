'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import GlobalSearch from '@/components/search/GlobalSearch'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

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
