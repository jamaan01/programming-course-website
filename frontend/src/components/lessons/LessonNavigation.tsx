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
  return (
    <nav
      className="grid gap-3 sm:grid-cols-2"
      aria-label="Навігація між уроками"
    >
      {previousLesson ? (
        <Button
          variant="outline"
          className="h-auto justify-start border-slate-700 bg-slate-900 px-4 py-3 text-left text-slate-200 hover:bg-slate-800 hover:text-slate-100"
          render={
            <Link to={`/courses/${courseId}/lessons/${previousLesson.id}`} />
          }
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-xs text-slate-500">
              Попередній урок
            </span>
            <span className="block truncate">{previousLesson.title}</span>
          </span>
        </Button>
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
        <Button
          variant="outline"
          className="h-auto justify-start border-slate-700 bg-slate-900 px-4 py-3 text-left text-slate-200 hover:bg-slate-800 hover:text-slate-100 sm:justify-end"
          render={<Link to={`/courses/${courseId}/lessons/${nextLesson.id}`} />}
        >
          <span className="min-w-0 sm:text-right">
            <span className="block text-xs text-slate-500">
              Наступний урок
            </span>
            <span className="block truncate">{nextLesson.title}</span>
          </span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
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
