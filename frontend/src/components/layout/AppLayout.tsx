import { Outlet } from 'react-router-dom'

import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'

export function AppLayout() {
  return (
    <div className="min-h-svh bg-slate-950 text-slate-100">
      <DesktopSidebar />
      <div className="flex min-h-svh flex-col lg:pl-64">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
