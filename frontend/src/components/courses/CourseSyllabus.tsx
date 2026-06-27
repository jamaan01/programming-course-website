import { CheckCircle, FileText, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { CourseModule } from '@/types/api'

interface CourseSyllabusProps {
  courseId: number
  modules: CourseModule[]
  completedLessonIds: number[]
  showProgress: boolean
  isLocked?: boolean
}

function sortModules(modules: CourseModule[]): CourseModule[] {
  return [...modules].sort((first, second) => first.order_num - second.order_num)
}

function getSortedLessons(module: CourseModule) {
  return [...(module.lessons ?? [])].sort(
    (first, second) => first.order_num - second.order_num,
  )
}

export function CourseSyllabus({
  courseId,
  modules,
  completedLessonIds,
  showProgress,
  isLocked = false,
}: CourseSyllabusProps) {
  const sortedModules = sortModules(modules)
  const completedLessonIdSet = new Set(completedLessonIds)
  const defaultOpenModule = sortedModules[0]
    ? [`module-${sortedModules[0].id}`]
    : []

  if (sortedModules.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-8 text-center">
        <p className="text-sm text-slate-400">
          Програма курсу поки порожня.
        </p>
      </div>
    )
  }

  return (
    <Accordion
      defaultValue={defaultOpenModule}
      className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
    >
      {sortedModules.map((module) => {
        const lessons = getSortedLessons(module)

        return (
          <AccordionItem
            key={module.id}
            value={`module-${module.id}`}
            className="border-slate-800 px-4"
          >
            <AccordionTrigger className="py-4 text-slate-100 hover:no-underline">
              <span className="flex flex-col gap-1">
                <span>{module.title}</span>
                <span className="text-xs font-normal text-slate-500">
                  {lessons.length} уроків
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {lessons.length > 0 ? (
                <ul className="space-y-2">
                  {lessons.map((lesson) => {
                    const isCompleted =
                      showProgress && completedLessonIdSet.has(lesson.id)
                    const LessonIcon = isCompleted
                      ? CheckCircle
                      : isLocked
                        ? Lock
                        : FileText

                    return (
                      <li key={lesson.id}>
                        <Link
                          to={`/courses/${courseId}/lessons/${lesson.id}`}
                          className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-3 text-sm text-slate-300 transition-colors hover:border-sky-500/40 hover:bg-slate-900 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                        >
                          <LessonIcon
                            className={
                              isCompleted
                                ? 'size-4 shrink-0 text-emerald-400'
                                : 'size-4 shrink-0 text-slate-500'
                            }
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">{lesson.title}</span>
                          {isLocked ? (
                            <span className="shrink-0 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-200">
                              Закрито
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-3 text-sm text-slate-500">
                  У цьому модулі поки немає уроків.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
