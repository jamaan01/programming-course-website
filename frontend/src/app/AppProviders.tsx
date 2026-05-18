import { type ReactNode, useEffect } from 'react'

import { useAuthStore } from '@/store/authStore'

let hasInitializedAuth = false

function AppLoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-950 px-6 text-slate-300">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-400" />
      </div>
    </div>
  )
}

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const authStatus = useAuthStore((state) => state.authStatus)
  const init = useAuthStore((state) => state.init)

  useEffect(() => {
    if (hasInitializedAuth) {
      return
    }

    hasInitializedAuth = true
    void init()
  }, [init])

  if (authStatus === 'idle') {
    return <AppLoadingScreen />
  }

  return children
}
