import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import type { CourseLesson } from '@/types/api'

interface LessonNavigationProps {
  courseId: number
  previousLesson: CourseLesson | null
  nextLesson: CourseLesson | null
}

export function LessonNavigation({
  courseId,
  previousLesson,
  nextLesson,
}: LessonNavigationProps) {
  const enabledLinkClass =
    'inline-flex h-auto items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm font-medium text-slate-200 transition-all hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'

  return (
    <nav
      className="grid gap-3 sm:grid-cols-2"
      aria-label="Навігація між уроками"
    >
      {previousLesson ? (
        <Link
          to={`/courses/${courseId}/lessons/${previousLesson.id}`}
          className={`${enabledLinkClass} justify-start`}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-xs text-slate-500">
              Попередній урок
            </span>
            <span className="block truncate">{previousLesson.title}</span>
          </span>
        </Link>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-auto justify-start border-slate-800 bg-slate-900 px-4 py-3 text-left text-slate-500"
          disabled
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Попереднього уроку немає
        </Button>
      )}

      {nextLesson ? (
        <Link
          to={`/courses/${courseId}/lessons/${nextLesson.id}`}
          className={`${enabledLinkClass} justify-start sm:justify-end`}
        >
          <span className="min-w-0 sm:text-right">
            <span className="block text-xs text-slate-500">
              Наступний урок
            </span>
            <span className="block truncate">{nextLesson.title}</span>
          </span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-auto justify-start border-slate-800 bg-slate-900 px-4 py-3 text-left text-slate-500 sm:justify-end"
          disabled
        >
          Наступного уроку немає
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      )}
    </nav>
  )
}
