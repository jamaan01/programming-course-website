import { BookOpen, LogOut, User } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-sky-500/10 text-sky-300'
      : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100',
  ].join(' ')

export function Header() {
  const navigate = useNavigate()
  const authStatus = useAuthStore((state) => state.authStatus)
  const logout = useAuthStore((state) => state.logout)
  const isAuthenticated = authStatus === 'authenticated'

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="border-b border-slate-800 bg-slate-950/95">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-base font-semibold text-slate-100"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-sky-500 text-slate-950">
            <BookOpen className="size-4" aria-hidden="true" />
          </span>
          Курси програмування
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/" className={navLinkClass}>
            Курси
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink to="/profile" className={navLinkClass}>
                <span className="inline-flex items-center gap-2">
                  <User className="size-4" aria-hidden="true" />
                  Профіль
                </span>
              </NavLink>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-200 hover:bg-slate-900 hover:text-slate-100"
                onClick={handleLogout}
              >
                <LogOut className="size-4" aria-hidden="true" />
                Вийти
              </Button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Увійти
              </NavLink>
              <NavLink to="/register" className={navLinkClass}>
                Зареєструватися
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
