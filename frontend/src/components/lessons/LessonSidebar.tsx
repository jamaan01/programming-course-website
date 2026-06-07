import { CheckCircle, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { CourseLesson, CourseModule } from '@/types/api'

interface LessonSidebarProps {
  courseId: number
  currentLessonId: number
  modules: CourseModule[]
  completedLessonIds: number[]
  progressPercent: number
  completedLessonsCount: number
  totalLessons: number
}

function sortModules(modules: CourseModule[]): CourseModule[] {
  return [...modules].sort((first, second) => first.order_num - second.order_num)
}

function sortLessons(lessons: CourseLesson[] = []): CourseLesson[] {
  return [...lessons].sort((first, second) => first.order_num - second.order_num)
}

export function LessonSidebar({
  courseId,
  currentLessonId,
  modules,
  completedLessonIds,
  progressPercent,
  completedLessonsCount,
  totalLessons,
}: LessonSidebarProps) {
  const sortedModules = sortModules(modules)
  const completedLessonIdSet = new Set(completedLessonIds)

  return (
    <aside className="space-y-4">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-200">Прогрес курсу</p>
          <span className="text-sm font-semibold text-cyan-300">
            {progressPercent}%
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-slate-400">
          Завершено {completedLessonsCount} з {totalLessons} уроків
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-base font-semibold text-slate-100">
          Програма курсу
        </h2>

        {sortedModules.length > 0 ? (
          <div className="mt-4 space-y-5">
            {sortedModules.map((module) => {
              const lessons = sortLessons(module.lessons)

              return (
                <div key={module.id} className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-300">
                    {module.title}
                  </h3>

                  {lessons.length > 0 ? (
                    <ul className="space-y-1.5">
                      {lessons.map((lesson) => {
                        const isActive = lesson.id === currentLessonId
                        const isCompleted = completedLessonIdSet.has(lesson.id)
                        const LessonIcon = isCompleted ? CheckCircle : FileText

                        return (
                          <li key={lesson.id}>
                            <Link
                              to={`/courses/${courseId}/lessons/${lesson.id}`}
                              className={[
                                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                                isActive
                                  ? 'border-sky-500/50 bg-sky-500/10 text-sky-100'
                                  : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-950/70 hover:text-slate-100',
                              ].join(' ')}
                              aria-current={isActive ? 'page' : undefined}
                            >
                              <LessonIcon
                                className={
                                  isCompleted
                                    ? 'size-4 shrink-0 text-emerald-400'
                                    : 'size-4 shrink-0 text-slate-500'
                                }
                                aria-hidden="true"
                              />
                              <span className="min-w-0 flex-1 truncate">
                                {lesson.title}
                              </span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-500">
                      У цьому модулі поки немає уроків.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-3 text-sm text-slate-500">
            Програма курсу поки порожня.
          </p>
        )}
      </section>
    </aside>
  )
}
