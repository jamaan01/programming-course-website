import { RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { CourseHeader } from '@/components/courses/CourseHeader'
import { CourseSyllabus } from '@/components/courses/CourseSyllabus'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  enrollInCourse,
  getCourseById,
  getCourseProgress,
  getCourseSyllabus,
} from '@/services/courseService'
import { useAuthStore } from '@/store/authStore'
import type {
  Course,
  CourseModule,
  CourseProgressResponse,
  NormalizedApiError,
} from '@/types/api'

const courseLoadErrorMessage =
  'Не вдалося завантажити курс. Спробуйте повторити запит.'
const enrollErrorMessage =
  'Не вдалося записатися на курс. Спробуйте ще раз.'

function parseCourseId(courseId: string | undefined): number | null {
  if (!courseId) {
    return null
  }

  const parsedCourseId = Number(courseId)

  if (!Number.isInteger(parsedCourseId) || parsedCourseId <= 0) {
    return null
  }

  return parsedCourseId
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

async function fetchCoursePageData(courseId: number) {
  const [course, syllabus] = await Promise.all([
    getCourseById(courseId),
    getCourseSyllabus(courseId),
  ])

  return { course, syllabus }
}

async function fetchProgress(courseId: number): Promise<CourseProgressResponse> {
  return getCourseProgress(courseId)
}

function countTotalLessons(modules: CourseModule[]): number {
  return modules.reduce(
    (total, module) => total + (module.lessons?.length ?? 0),
    0,
  )
}

interface CoursePageLoadingStateProps {
  courseId: number
}

function CoursePageLoadingState({ courseId }: CoursePageLoadingStateProps) {
  return (
    <div className="space-y-8" aria-label={`Курс ${courseId} завантажується`}>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Skeleton className="h-5 w-36 bg-slate-800" />
          <Skeleton className="h-10 w-4/5 bg-slate-800" />
          <Skeleton className="h-5 w-full max-w-2xl bg-slate-800" />
          <Skeleton className="h-5 w-2/3 bg-slate-800" />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <Skeleton className="mb-4 h-5 w-32 bg-slate-800" />
          <Skeleton className="mb-3 h-2 w-full bg-slate-800" />
          <Skeleton className="h-9 w-full bg-slate-800" />
        </div>
      </section>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <Skeleton className="mb-4 h-7 w-52 bg-slate-800" />
        <Skeleton className="mb-3 h-12 w-full bg-slate-800" />
        <Skeleton className="mb-3 h-12 w-full bg-slate-800" />
        <Skeleton className="h-12 w-full bg-slate-800" />
      </div>
    </div>
  )
}

interface CoursePageErrorStateProps {
  message: string
  onRetry?: () => void
}

function CoursePageErrorState({ message, onRetry }: CoursePageErrorStateProps) {
  return (
    <div
      className="rounded-xl border border-rose-500/30 bg-slate-900 px-5 py-6 text-slate-300"
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

export function CoursePage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const authStatus = useAuthStore((state) => state.authStatus)
  const parsedCourseId = parseCourseId(courseId)

  const [course, setCourse] = useState<Course | null>(null)
  const [syllabus, setSyllabus] = useState<Course | null>(null)
  const [isCourseLoading, setIsCourseLoading] = useState(true)
  const [courseError, setCourseError] = useState<string | null>(null)
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([])
  const [hasProgressData, setHasProgressData] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isEnrollmentLoading, setIsEnrollmentLoading] = useState(false)
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null)

  const loadCourseData = useCallback(async () => {
    if (!parsedCourseId) {
      return
    }

    setIsCourseLoading(true)
    setCourseError(null)

    try {
      const response = await fetchCoursePageData(parsedCourseId)

      setCourse(response.course)
      setSyllabus(response.syllabus)
    } catch {
      setCourse(null)
      setSyllabus(null)
      setCourseError(courseLoadErrorMessage)
    } finally {
      setIsCourseLoading(false)
    }
  }, [parsedCourseId])

  const loadProgress = useCallback(async (): Promise<boolean> => {
    if (!parsedCourseId || authStatus !== 'authenticated') {
      return false
    }

    try {
      const progress = await fetchProgress(parsedCourseId)

      setCompletedLessonIds(progress.completed_lesson_ids)
      setHasProgressData(true)
      setIsEnrolled(true)

      return true
    } catch (error) {
      const status = getErrorStatus(error)

      setCompletedLessonIds([])
      setHasProgressData(false)

      if (status === 403 || status === 404) {
        setIsEnrolled(false)
        return false
      }

      setIsEnrolled(false)
      return false
    }
  }, [authStatus, parsedCourseId])

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

        setIsCourseLoading(true)
        setCourseError(null)
        return fetchCoursePageData(parsedCourseId)
      })
      .then((response) => {
        if (!isMounted || !response) {
          return
        }

        setCourse(response.course)
        setSyllabus(response.syllabus)
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setCourse(null)
        setSyllabus(null)
        setCourseError(courseLoadErrorMessage)
      })
      .finally(() => {
        if (!isMounted) {
          return
        }

        setIsCourseLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [parsedCourseId])

  useEffect(() => {
    if (!parsedCourseId || authStatus !== 'authenticated') {
      return
    }

    let isMounted = true

    void Promise.resolve()
      .then(() => fetchProgress(parsedCourseId))
      .then((progress) => {
        if (!isMounted) {
          return
        }

        setCompletedLessonIds(progress.completed_lesson_ids)
        setHasProgressData(true)
        setIsEnrolled(true)
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        const status = getErrorStatus(error)

        setCompletedLessonIds([])
        setHasProgressData(false)

        if (status === 403 || status === 404) {
          setIsEnrolled(false)
          return
        }

        setIsEnrolled(false)
      })

    return () => {
      isMounted = false
    }
  }, [authStatus, parsedCourseId])

  const modules = useMemo(() => syllabus?.modules ?? [], [syllabus])
  const totalLessons = useMemo(() => countTotalLessons(modules), [modules])
  const progressPercent =
    totalLessons === 0
      ? 0
      : Math.round((completedLessonIds.length / totalLessons) * 100)
  const showProgress =
    authStatus === 'authenticated' && isEnrolled && hasProgressData
  const effectiveIsEnrolled = authStatus === 'authenticated' && isEnrolled

  async function handleEnroll() {
    if (!parsedCourseId) {
      return
    }

    setEnrollmentError(null)

    if (authStatus !== 'authenticated') {
      navigate('/login')
      return
    }

    setIsEnrollmentLoading(true)

    try {
      await enrollInCourse(parsedCourseId)
      await loadProgress()
    } catch {
      setEnrollmentError(enrollErrorMessage)
    } finally {
      setIsEnrollmentLoading(false)
    }
  }

  if (!parsedCourseId) {
    return (
      <PageContainer>
        <CoursePageErrorState message="Некоректний ідентифікатор курсу." />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {isCourseLoading ? (
        <CoursePageLoadingState courseId={parsedCourseId} />
      ) : null}

      {!isCourseLoading && courseError ? (
        <CoursePageErrorState message={courseError} onRetry={loadCourseData} />
      ) : null}

      {!isCourseLoading && !courseError && course ? (
        <div className="space-y-8">
          <CourseHeader
            course={course}
            authStatus={authStatus}
            isEnrolled={effectiveIsEnrolled}
            isEnrollmentLoading={isEnrollmentLoading}
            enrollmentError={enrollmentError}
            showProgress={showProgress}
            progressPercent={progressPercent}
            completedLessonsCount={completedLessonIds.length}
            totalLessons={totalLessons}
            onEnroll={handleEnroll}
          />

          <section className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-100">
                Програма курсу
              </h2>
              <p className="text-sm leading-6 text-slate-400">
                Модулі та уроки курсу доступні для перегляду.
              </p>
            </div>

            <CourseSyllabus
              courseId={parsedCourseId}
              modules={modules}
              completedLessonIds={completedLessonIds}
              showProgress={showProgress}
            />
          </section>
        </div>
      ) : null}
    </PageContainer>
  )
}
