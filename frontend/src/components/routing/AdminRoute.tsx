import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/authStore'

interface AdminRouteProps {
  children: ReactNode
}

function AdminRouteLoading() {
  return (
    <PageContainer>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <Skeleton className="mb-4 h-5 w-40 bg-slate-800" />
        <Skeleton className="h-8 w-64 bg-slate-800" />
      </div>
    </PageContainer>
  )
}

function AdminRouteForbidden() {
  return (
    <PageContainer>
      <div
        className="rounded-xl border border-rose-500/30 bg-slate-900 px-5 py-8"
        role="alert"
      >
        <p className="text-lg font-semibold text-slate-100">
          Немає доступу до адмін-панелі
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Цей розділ доступний лише користувачам з роллю адміністратора.
        </p>
        <Button
          className="mt-5 bg-sky-500 text-slate-950 hover:bg-sky-400"
          render={<Link to="/" />}
        >
          Повернутися до курсів
        </Button>
      </div>
    </PageContainer>
  )
}

export function AdminRoute({ children }: AdminRouteProps) {
  const authStatus = useAuthStore((state) => state.authStatus)
  const isLoading = useAuthStore((state) => state.isLoading)
  const user = useAuthStore((state) => state.user)

  if (authStatus === 'idle' || (authStatus === 'authenticated' && !user)) {
    return <AdminRouteLoading />
  }

  if (isLoading && !user) {
    return <AdminRouteLoading />
  }

  if (user?.role !== 'admin') {
    return <AdminRouteForbidden />
  }

  return children
}
