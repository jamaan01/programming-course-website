import { type ReactNode, useEffect } from 'react'

import { useAuthStore } from '@/store/authStore'

let hasInitializedAuth = false

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const init = useAuthStore((state) => state.init)

  useEffect(() => {
    if (hasInitializedAuth) {
      return
    }

    hasInitializedAuth = true
    void init()
  }, [init])

  return children
}
