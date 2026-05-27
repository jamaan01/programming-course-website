import { Link, Outlet } from 'react-router-dom'

import golabLogo from '@/assets/brand/golab-logo.png'

export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-slate-950 px-4 py-10 text-slate-100 sm:py-12">
      <Link
        to="/"
        className="mb-12 inline-flex transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:mb-14"
        aria-label="На головну"
      >
        <img
          src={golabLogo}
          alt="Golab"
          className="h-40 w-auto object-contain sm:h-44 lg:h-48"
        />
      </Link>
      <Outlet />
    </div>
  )
}
