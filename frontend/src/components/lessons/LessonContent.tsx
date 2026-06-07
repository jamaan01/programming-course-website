import { CheckCircle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Lesson } from '@/types/api'

interface LessonContentProps {
  lesson: Lesson
  isCompleted: boolean
  isCompleting: boolean
  onComplete: () => void
}

export function LessonContent({
  lesson,
  isCompleted,
  isCompleting,
  onComplete,
}: LessonContentProps) {
  const content = lesson.content.trim()

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900">
      <header className="border-b border-slate-800 px-5 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-cyan-300">Урок</p>
            <h1 className="text-3xl font-semibold text-slate-100">
              {lesson.title}
            </h1>
          </div>

          {isCompleted ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200">
              <CheckCircle className="size-4" aria-hidden="true" />
              Урок завершено
            </div>
          ) : (
            <Button
              type="button"
              className="bg-sky-500 text-slate-950 hover:bg-sky-400"
              onClick={onComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Зачекайте...
                </>
              ) : (
                'Позначити як пройдений'
              )}
            </Button>
          )}
        </div>
      </header>

      <div className="px-5 py-6">
        {content ? (
          <div className="whitespace-pre-wrap break-words text-base leading-8 text-slate-300">
            {content}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-6 text-sm text-slate-400">
            У цьому уроці поки немає контенту.
          </div>
        )}
      </div>
    </article>
  )
}
