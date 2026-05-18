import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'

function ProtectedRouteLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-950 px-6 text-slate-300">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-400" />
      </div>
    </div>
  )
}

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const authStatus = useAuthStore((state) => state.authStatus)

  if (authStatus === 'idle') {
    return <ProtectedRouteLoading />
  }

  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
