import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

const COURSE_PRICE_UAH = 1000

interface CourseAccessLockedCardProps {
  purchaseHref: string
  title?: string
  description?: string
  compact?: boolean
}

export function CourseAccessLockedCard({
  purchaseHref,
  title = 'Доступ до курсу закритий',
  description = 'Щоб почати навчання, придбайте доступ до курсу. Після підтвердження оплати ми відкриємо доступ вручну.',
  compact = false,
}: CourseAccessLockedCardProps) {
  return (
    <section
      className={[
        'rounded-xl border border-sky-400/20 bg-slate-900/80 text-slate-200 shadow-sm shadow-sky-950/20',
        compact ? 'px-4 py-4' : 'px-5 py-6',
      ].join(' ')}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-400/10 text-sky-200">
            <Lock className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-base font-semibold text-slate-100">{title}</p>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              {description}
            </p>
            <p className="text-sm font-semibold text-cyan-200">
              Вартість: {COURSE_PRICE_UAH} грн
            </p>
          </div>
        </div>

        <Link
          to={purchaseHref}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          Купити
        </Link>
      </div>
    </section>
  )
}
