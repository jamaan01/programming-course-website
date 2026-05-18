import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <Outlet />
    </div>
  )
}
