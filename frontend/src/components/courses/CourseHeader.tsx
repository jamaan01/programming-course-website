import { ArrowLeft, CheckCircle, Loader2, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Course } from '@/types/api'

const COURSE_PRICE_UAH = 1000

type CourseAuthStatus = 'idle' | 'authenticated' | 'unauthenticated'

interface CourseHeaderProps {
  course: Course
  authStatus: CourseAuthStatus
  isEnrolled: boolean
  isEnrollmentLoading: boolean
  enrollmentError: string | null
  showProgress: boolean
  progressPercent: number
  completedLessonsCount: number
  totalLessons: number
  onEnroll: () => void
}

export function CourseHeader({
  course,
  authStatus,
  isEnrolled,
  isEnrollmentLoading,
  enrollmentError,
  showProgress,
  progressPercent,
  completedLessonsCount,
  totalLessons,
  onEnroll,
}: CourseHeaderProps) {
  const title = course.title.trim() || 'Курс без назви'
  const description =
    course.description.trim() || 'Опис курсу поки не додано.'
  const isAuthResolving = authStatus === 'idle'

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 transition-colors hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          До каталогу курсів
        </Link>

        <div className="space-y-3">
          <Badge className="border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
            Курс програмування
          </Badge>
          <h1 className="max-w-4xl text-3xl font-semibold text-slate-100 sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <aside className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="space-y-4">
          {showProgress ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-200">
                  Прогрес курсу
                </p>
                <span className="text-sm font-semibold text-cyan-300">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-slate-400">
                Завершено {completedLessonsCount} з {totalLessons} уроків
              </p>
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-400">
              Перегляньте програму курсу. Доступ до уроків, питань і прогресу
              відкривається вручну після покупки.
            </p>
          )}

          {isEnrolled ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200">
              <CheckCircle className="size-4" aria-hidden="true" />
              Доступ до курсу відкрито
            </div>
          ) : (
            <Button
              type="button"
              className="w-full bg-sky-500 text-slate-950 hover:bg-sky-400"
              onClick={onEnroll}
              disabled={isEnrollmentLoading || isAuthResolving}
            >
              {isEnrollmentLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Зачекайте...
                </>
              ) : isAuthResolving ? (
                'Перевіряємо вхід...'
              ) : (
                <>
                  <Lock className="size-4" aria-hidden="true" />
                  Купити
                </>
              )}
            </Button>
          )}

          {!isEnrolled ? (
            <p className="text-sm font-semibold text-cyan-200">
              Вартість: {COURSE_PRICE_UAH} грн
            </p>
          ) : null}

          {enrollmentError ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {enrollmentError}
            </p>
          ) : null}
        </div>
      </aside>
    </section>
  )
}
