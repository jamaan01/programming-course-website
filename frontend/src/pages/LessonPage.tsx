import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { LessonContent } from '@/components/lessons/LessonContent'
import { LessonNavigation } from '@/components/lessons/LessonNavigation'
import { LessonSidebar } from '@/components/lessons/LessonSidebar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getCourseProgress, getCourseSyllabus } from '@/services/courseService'
import { completeLesson, getLessonById } from '@/services/lessonService'
import type {
  Course,
  CourseLesson,
  CourseModule,
  CourseProgressResponse,
  Lesson,
  NormalizedApiError,
} from '@/types/api'

const notEnrolledMessage = 'Ви не записані на цей курс'
const lessonLoadErrorMessage =
  'Не вдалося завантажити урок. Спробуйте повторити запит.'
const syllabusLoadErrorMessage =
  'Не вдалося завантажити програму курсу. Спробуйте повторити запит.'
const progressLoadErrorMessage =
  'Не вдалося завантажити прогрес курсу. Спробуйте повторити запит.'
const completeLessonErrorMessage =
  'Не вдалося позначити урок як пройдений. Спробуйте ще раз.'

function parseRouteId(routeId: string | undefined): number | null {
  if (!routeId) {
    return null
  }

  const parsedId = Number(routeId)

  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null
}

function isNormalizedApiError(error: unknown): error is NormalizedApiError {
  if (!error || typeof error !== 'object') {
    return false
  }

  return (
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  )
}

function getErrorStatus(error: unknown): number | undefined {
  return isNormalizedApiError(error) ? error.status : undefined
}

function isAccessDeniedStatus(status: number | undefined): boolean {
  return status === 403 || status === 404
}

function getModules(syllabus: Course | null): CourseModule[] {
  return syllabus?.modules ?? []
}

function getSortedModules(modules: CourseModule[]): CourseModule[] {
  return [...modules].sort((first, second) => first.order_num - second.order_num)
}

function getSortedLessons(module: CourseModule): CourseLesson[] {
  return [...(module.lessons ?? [])].sort(
    (first, second) => first.order_num - second.order_num,
  )
}

function flattenLessons(modules: CourseModule[]): CourseLesson[] {
  return getSortedModules(modules).flatMap((module) => getSortedLessons(module))
}

function countTotalLessons(modules: CourseModule[]): number {
  return modules.reduce(
    (total, module) => total + (module.lessons?.length ?? 0),
    0,
  )
}

interface LessonErrorStateProps {
  message: string
  onRetry?: () => void
}

function LessonErrorState({ message, onRetry }: LessonErrorStateProps) {
  return (
    <div
      className="rounded-xl border border-rose-500/30 bg-slate-900 px-5 py-6"
      role="alert"
    >
      <p className="text-base font-medium text-slate-100">Сталася помилка</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        {message}
      </p>
      {onRetry ? (
        <Button
          type="button"
          className="mt-5 bg-sky-500 text-slate-950 hover:bg-sky-400"
          onClick={onRetry}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Спробувати ще раз
        </Button>
      ) : null}
    </div>
  )
}

interface NotEnrolledStateProps {
  courseId: number
}

function NotEnrolledState({ courseId }: NotEnrolledStateProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-8">
      <p className="text-lg font-semibold text-slate-100">
        {notEnrolledMessage}
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        Запишіться на курс, щоб отримати доступ до уроків і прогресу навчання.
      </p>
      <Button
        className="mt-5 bg-sky-500 text-slate-950 hover:bg-sky-400"
        render={<Link to={`/courses/${courseId}`} />}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Повернутися до курсу
      </Button>
    </div>
  )
}

function LessonContentSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <Skeleton className="mb-4 h-4 w-20 bg-slate-800" />
      <Skeleton className="mb-6 h-9 w-3/4 bg-slate-800" />
      <Skeleton className="mb-3 h-4 w-full bg-slate-800" />
      <Skeleton className="mb-3 h-4 w-11/12 bg-slate-800" />
      <Skeleton className="mb-3 h-4 w-full bg-slate-800" />
      <Skeleton className="h-4 w-2/3 bg-slate-800" />
    </div>
  )
}

function LessonSidebarSkeleton() {
  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <Skeleton className="mb-3 h-5 w-32 bg-slate-800" />
        <Skeleton className="h-2 w-full bg-slate-800" />
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <Skeleton className="mb-4 h-6 w-40 bg-slate-800" />
        <Skeleton className="mb-2 h-10 w-full bg-slate-800" />
        <Skeleton className="mb-2 h-10 w-full bg-slate-800" />
        <Skeleton className="h-10 w-full bg-slate-800" />
      </div>
    </aside>
  )
}

export function LessonPage() {
  const { courseId, lessonId } = useParams()
  const parsedCourseId = parseRouteId(courseId)
  const parsedLessonId = parseRouteId(lessonId)

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [syllabus, setSyllabus] = useState<Course | null>(null)
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([])
  const [isLessonLoading, setIsLessonLoading] = useState(true)
  const [isSyllabusLoading, setIsSyllabusLoading] = useState(true)
  const [isProgressLoading, setIsProgressLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [lessonError, setLessonError] = useState<string | null>(null)
  const [syllabusError, setSyllabusError] = useState<string | null>(null)
  const [progressError, setProgressError] = useState<string | null>(null)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [isNotEnrolled, setIsNotEnrolled] = useState(false)

  const modules = useMemo(() => getModules(syllabus), [syllabus])
  const orderedLessons = useMemo(() => flattenLessons(modules), [modules])
  const totalLessons = useMemo(() => countTotalLessons(modules), [modules])
  const completedLessonIdSet = useMemo(
    () => new Set(completedLessonIds),
    [completedLessonIds],
  )
  const isCurrentLessonCompleted = parsedLessonId
    ? completedLessonIdSet.has(parsedLessonId)
    : false
  const progressPercent =
    totalLessons === 0
      ? 0
      : Math.round((completedLessonIds.length / totalLessons) * 100)
  const currentLessonIndex = parsedLessonId
    ? orderedLessons.findIndex((item) => item.id === parsedLessonId)
    : -1
  const previousLesson =
    currentLessonIndex > 0 ? orderedLessons[currentLessonIndex - 1] : null
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < orderedLessons.length - 1
      ? orderedLessons[currentLessonIndex + 1]
      : null

  const loadLesson = useCallback(async () => {
    if (!parsedLessonId) {
      return
    }

    setIsLessonLoading(true)
    setLesson(null)
    setLessonError(null)
    setCompleteError(null)

    try {
      const lessonData = await getLessonById(parsedLessonId)

      setLesson(lessonData)
    } catch (error) {
      const status = getErrorStatus(error)

      setLesson(null)

      if (status === 403) {
        setIsNotEnrolled(true)
        return
      }

      setLessonError(lessonLoadErrorMessage)
    } finally {
      setIsLessonLoading(false)
    }
  }, [parsedLessonId])

  const loadSyllabus = useCallback(async () => {
    if (!parsedCourseId) {
      return
    }

    setIsSyllabusLoading(true)
    setSyllabusError(null)

    try {
      const syllabusData = await getCourseSyllabus(parsedCourseId)

      setSyllabus(syllabusData)
    } catch (error) {
      const status = getErrorStatus(error)

      setSyllabus(null)

      if (status === 403) {
        setIsNotEnrolled(true)
        return
      }

      setSyllabusError(syllabusLoadErrorMessage)
    } finally {
      setIsSyllabusLoading(false)
    }
  }, [parsedCourseId])

  const loadProgress = useCallback(async (): Promise<boolean> => {
    if (!parsedCourseId) {
      return false
    }

    setIsProgressLoading(true)
    setProgressError(null)

    try {
      const progressData: CourseProgressResponse =
        await getCourseProgress(parsedCourseId)

      setCompletedLessonIds(progressData.completed_lesson_ids)
      setIsNotEnrolled(false)

      return true
    } catch (error) {
      const status = getErrorStatus(error)

      setCompletedLessonIds([])

      if (isAccessDeniedStatus(status)) {
        setIsNotEnrolled(true)
        return false
      }

      setProgressError(progressLoadErrorMessage)
      return false
    } finally {
      setIsProgressLoading(false)
    }
  }, [parsedCourseId])

  const reloadPageData = useCallback(() => {
    void loadSyllabus()
    void loadProgress()
    void loadLesson()
  }, [loadLesson, loadProgress, loadSyllabus])

  useEffect(() => {
    if (!parsedCourseId) {
      return
    }

    let isMounted = true

    void Promise.resolve()
      .then(() => {
        if (!isMounted) {
          return null
        }

        setIsSyllabusLoading(true)
        setSyllabusError(null)
        return getCourseSyllabus(parsedCourseId)
      })
      .then((syllabusData) => {
        if (!isMounted || !syllabusData) {
          return
        }

        setSyllabus(syllabusData)
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        const status = getErrorStatus(error)

        setSyllabus(null)

        if (status === 403) {
          setIsNotEnrolled(true)
          return
        }

        setSyllabusError(syllabusLoadErrorMessage)
      })
      .finally(() => {
        if (isMounted) {
          setIsSyllabusLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [parsedCourseId])

  useEffect(() => {
    if (!parsedCourseId) {
      return
    }

    let isMounted = true

    void Promise.resolve()
      .then(() => {
        if (!isMounted) {
          return null
        }

        setIsProgressLoading(true)
        setProgressError(null)
        return getCourseProgress(parsedCourseId)
      })
      .then((progressData) => {
        if (!isMounted || !progressData) {
          return
        }

        setCompletedLessonIds(progressData.completed_lesson_ids)
        setIsNotEnrolled(false)
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        const status = getErrorStatus(error)

        setCompletedLessonIds([])

        if (isAccessDeniedStatus(status)) {
          setIsNotEnrolled(true)
          return
        }

        setProgressError(progressLoadErrorMessage)
      })
      .finally(() => {
        if (isMounted) {
          setIsProgressLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [parsedCourseId])

  useEffect(() => {
    if (!parsedLessonId) {
      return
    }

    let isMounted = true

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    void Promise.resolve()
      .then(() => {
        if (!isMounted) {
          return null
        }

        setIsLessonLoading(true)
        setLesson(null)
        setLessonError(null)
        setCompleteError(null)
        return getLessonById(parsedLessonId)
      })
      .then((lessonData) => {
        if (!isMounted || !lessonData) {
          return
        }

        setLesson(lessonData)
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        const status = getErrorStatus(error)

        setLesson(null)

        if (status === 403) {
          setIsNotEnrolled(true)
          return
        }

        setLessonError(lessonLoadErrorMessage)
      })
      .finally(() => {
        if (isMounted) {
          setIsLessonLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [parsedLessonId])

  async function handleCompleteLesson() {
    if (!parsedLessonId) {
      return
    }

    setIsCompleting(true)
    setCompleteError(null)

    try {
      await completeLesson(parsedLessonId, { completed: true })
      await loadProgress()
    } catch (error) {
      const status = getErrorStatus(error)

      if (status === 403) {
        setIsNotEnrolled(true)
        return
      }

      setCompleteError(completeLessonErrorMessage)
    } finally {
      setIsCompleting(false)
    }
  }

  if (!parsedCourseId || !parsedLessonId) {
    return (
      <PageContainer>
        <LessonErrorState message="Некоректний ідентифікатор курсу або уроку." />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <Link
          to={`/courses/${parsedCourseId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 transition-colors hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Повернутися до курсу
        </Link>

        {isNotEnrolled ? (
          <NotEnrolledState courseId={parsedCourseId} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="order-2 lg:order-1">
              {isSyllabusLoading && !syllabus ? (
                <LessonSidebarSkeleton />
              ) : (
                <LessonSidebar
                  courseId={parsedCourseId}
                  currentLessonId={parsedLessonId}
                  modules={modules}
                  completedLessonIds={completedLessonIds}
                  progressPercent={progressPercent}
                  completedLessonsCount={completedLessonIds.length}
                  totalLessons={totalLessons}
                />
              )}
            </div>

            <main className="order-1 min-w-0 space-y-4 lg:order-2">
              {syllabusError ? (
                <LessonErrorState
                  message={syllabusError}
                  onRetry={loadSyllabus}
                />
              ) : null}

              {progressError ? (
                <LessonErrorState
                  message={progressError}
                  onRetry={loadProgress}
                />
              ) : null}

              {isLessonLoading || isProgressLoading ? (
                <LessonContentSkeleton />
              ) : null}

              {!isLessonLoading && !isProgressLoading && lessonError ? (
                <LessonErrorState
                  message={lessonError}
                  onRetry={loadLesson}
                />
              ) : null}

              {!isLessonLoading &&
              !isProgressLoading &&
              !lessonError &&
              lesson ? (
                <>
                  <LessonContent
                    lesson={lesson}
                    isCompleted={isCurrentLessonCompleted}
                    isCompleting={isCompleting}
                    onComplete={handleCompleteLesson}
                  />

                  {completeError ? (
                    <LessonErrorState message={completeError} />
                  ) : null}

                  <LessonNavigation
                    courseId={parsedCourseId}
                    previousLesson={previousLesson}
                    nextLesson={nextLesson}
                  />
                </>
              ) : null}

              {!isLessonLoading &&
              !isProgressLoading &&
              !lessonError &&
              !lesson ? (
                <LessonErrorState
                  message="Урок не знайдено."
                  onRetry={reloadPageData}
                />
              ) : null}
            </main>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
