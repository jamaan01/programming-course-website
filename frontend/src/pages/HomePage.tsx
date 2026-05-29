import { RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { CourseCard } from '@/components/courses/CourseCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getCourses } from '@/services/courseService'
import type { Course } from '@/types/api'

const coursesSkeletonItems = Array.from({ length: 6 }, (_, index) => index)

function getCourseListFromResponse(response: unknown): Course[] | null {
  if (Array.isArray(response)) {
    return response as Course[]
  }

  if (!response || typeof response !== 'object') {
    return null
  }

  const payload = response as { courses?: unknown; data?: unknown }

  if (Array.isArray(payload.courses)) {
    return payload.courses as Course[]
  }

  if (Array.isArray(payload.data)) {
    return payload.data as Course[]
  }

  return null
}

async function fetchCourses(): Promise<Course[]> {
  const response: unknown = await getCourses()
  const courseList = getCourseListFromResponse(response)

  if (!courseList) {
    throw new Error('Unexpected courses response shape')
  }

  return courseList
}

function CoursesLoadingState() {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Курси завантажуються"
    >
      {coursesSkeletonItems.map((item) => (
        <div
          key={item}
          className="min-h-60 rounded-xl border border-slate-800 bg-slate-900 p-4"
        >
          <Skeleton className="mb-4 h-4 w-16 bg-slate-800" />
          <Skeleton className="mb-3 h-7 w-4/5 bg-slate-800" />
          <Skeleton className="mb-2 h-4 w-full bg-slate-800" />
          <Skeleton className="mb-2 h-4 w-11/12 bg-slate-800" />
          <Skeleton className="h-4 w-2/3 bg-slate-800" />
          <div className="mt-10 border-t border-slate-800 pt-4">
            <Skeleton className="h-9 w-40 bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface CoursesErrorStateProps {
  message: string
  onRetry: () => void
}

function CoursesErrorState({ message, onRetry }: CoursesErrorStateProps) {
  return (
    <div
      className="rounded-xl border border-rose-500/30 bg-slate-900 px-5 py-6 text-slate-300"
      role="alert"
    >
      <p className="text-base font-medium text-slate-100">
        Не вдалося завантажити курси
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        {message}
      </p>
      <Button
        type="button"
        className="mt-5 bg-sky-500 text-slate-950 hover:bg-sky-400"
        onClick={onRetry}
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Спробувати ще раз
      </Button>
    </div>
  )
}

function CoursesEmptyState() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-8 text-center">
      <p className="text-base text-slate-400">
        Наразі курсів немає, але вони скоро зʼявляться.
      </p>
    </div>
  )
}

export function HomePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadCourses = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const courseList = await fetchCourses()
      setCourses(courseList)
    } catch {
      setCourses([])
      setErrorMessage(
        'Перевірте підключення до сервера або спробуйте повторити запит.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    void fetchCourses()
      .then((courseList) => {
        if (!isMounted) {
          return
        }

        setCourses(courseList)
        setErrorMessage(null)
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setCourses([])
        setErrorMessage(
          'Перевірте підключення до сервера або спробуйте повторити запит.',
        )
      })
      .finally(() => {
        if (!isMounted) {
          return
        }

        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const hasCourses = courses.length > 0

  return (
    <PageContainer>
      <div className="space-y-8">
        <section className="max-w-3xl space-y-3">
          <p className="text-sm font-medium text-cyan-300">Каталог курсів</p>
          <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
            Курси програмування
          </h1>
          <p className="text-base leading-7 text-slate-400">
            Оберіть курс і переходьте до навчання у зручному темпі.
          </p>
        </section>

        {isLoading ? <CoursesLoadingState /> : null}

        {!isLoading && errorMessage ? (
          <CoursesErrorState message={errorMessage} onRetry={loadCourses} />
        ) : null}

        {!isLoading && !errorMessage && !hasCourses ? (
          <CoursesEmptyState />
        ) : null}

        {!isLoading && !errorMessage && hasCourses ? (
          <section
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Список курсів"
          >
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </section>
        ) : null}
      </div>
    </PageContainer>
  )
}
