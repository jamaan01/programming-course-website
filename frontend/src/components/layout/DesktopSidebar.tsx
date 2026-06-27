import {
  BookOpen,
  Briefcase,
  LogIn,
  LogOut,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import golabMark from '@/assets/brand/golab-mark.png'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
      : 'border-transparent text-slate-300 hover:border-slate-800 hover:bg-slate-900 hover:text-slate-100',
  ].join(' ')

export function DesktopSidebar() {
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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-800 bg-slate-950/95 px-4 py-5 lg:flex lg:flex-col">
      <Link
        to="/"
        className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 transition-colors hover:border-sky-500/40"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60">
          <img
            src={golabMark}
            alt="GoLab"
            className="size-10 object-contain"
          />
        </span>
        <span className="min-w-0">
          <span className="block text-base font-semibold text-slate-100">
            GoLab
          </span>
          <span className="block text-xs text-slate-400">
            Курси програмування
          </span>
        </span>
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        <NavLink to="/" className={navLinkClass}>
          <BookOpen className="size-4" aria-hidden="true" />
          Курси
        </NavLink>

        <div
          className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-slate-800/80 bg-slate-900/50 px-3 py-2.5 text-sm font-medium text-slate-300"
          aria-disabled="true"
        >
          <Briefcase className="size-4 text-cyan-300" aria-hidden="true" />
          <span className="min-w-0 flex-1">Фриланс-дошка</span>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-cyan-200">
            Coming soon
          </span>
        </div>

        {isAuthenticated ? (
          <>
            {isAdmin ? (
              <NavLink to="/admin" className={navLinkClass}>
                <ShieldCheck className="size-4" aria-hidden="true" />
                Адмін
              </NavLink>
            ) : null}
            <NavLink to="/profile" className={navLinkClass}>
              <User className="size-4" aria-hidden="true" />
              Профіль
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/login" className={navLinkClass}>
              <LogIn className="size-4" aria-hidden="true" />
              Увійти
            </NavLink>
            <NavLink to="/register" className={navLinkClass}>
              <UserPlus className="size-4" aria-hidden="true" />
              Реєстрація
            </NavLink>
          </>
        )}
      </nav>

      {isAuthenticated ? (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start border-slate-700 text-slate-200 hover:bg-slate-900 hover:text-slate-100"
          onClick={handleLogout}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Вийти
        </Button>
      ) : null}
    </aside>
  )
}
