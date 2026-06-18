import type { Lesson } from '@/types/api'

interface LessonContentProps {
  lesson: Lesson
}

export function LessonContent({ lesson }: LessonContentProps) {
  const content = lesson.content.trim()

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900">
      <header className="border-b border-slate-800 px-5 py-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-cyan-300">Урок</p>
          <h1 className="text-3xl font-semibold text-slate-100">
            {lesson.title}
          </h1>
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
