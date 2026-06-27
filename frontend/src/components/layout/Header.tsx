import { BookOpen, Briefcase, LogOut, ShieldCheck, User } from 'lucide-react'
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
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const isAuthenticated = authStatus === 'authenticated'
  const isAdmin = isAuthenticated && user?.role === 'admin'

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="relative z-30 border-b border-slate-800 bg-slate-950/95 lg:hidden">
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

          <span
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm font-medium text-slate-300"
            aria-disabled="true"
          >
            <Briefcase className="size-4 text-cyan-300" aria-hidden="true" />
            Фриланс-дошка
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-cyan-200">
              Coming soon
            </span>
          </span>

          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <NavLink to="/admin" className={navLinkClass}>
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    Адмін
                  </span>
                </NavLink>
              ) : null}
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
