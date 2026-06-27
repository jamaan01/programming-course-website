import { ArrowLeft, CheckCircle2, Copy, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getCourseById } from '@/services/courseService'
import { useAuthStore } from '@/store/authStore'
import type { Course } from '@/types/api'

const COURSE_PRICE_UAH = 1000
const TELEGRAM_URL = 'https://t.me/golab_school'

function parseCourseId(courseId: string | undefined): number | null {
  if (!courseId) {
    return null
  }

  const parsedCourseId = Number(courseId)

  return Number.isInteger(parsedCourseId) && parsedCourseId > 0
    ? parsedCourseId
    : null
}

function getRedirectUrl(path: string): string {
  return encodeURIComponent(path)
}

interface PurchaseErrorStateProps {
  message: string
  onRetry?: () => void
}

function PurchaseErrorState({ message, onRetry }: PurchaseErrorStateProps) {
  return (
    <div
      className="rounded-xl border border-rose-500/30 bg-slate-900 px-5 py-6"
      role="alert"
    >
      <p className="text-base font-medium text-slate-100">Не вдалося відкрити сторінку</p>
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

export function CoursePurchasePage() {
  const { courseId } = useParams()
  const parsedCourseId = parseCourseId(courseId)
  const authStatus = useAuthStore((state) => state.authStatus)
  const userEmail = useAuthStore((state) => state.user?.email)
  const [course, setCourse] = useState<Course | null>(null)
  const [isCourseLoading, setIsCourseLoading] = useState(true)
  const [courseError, setCourseError] = useState<string | null>(null)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  const purchasePath = parsedCourseId
    ? `/courses/${parsedCourseId}/buy`
    : '/courses'
  const loginPath = `/login?redirect=${getRedirectUrl(purchasePath)}`
  const registerPath = `/register?redirect=${getRedirectUrl(purchasePath)}`
  const isAuthenticated = authStatus === 'authenticated'
  const courseTitle = course?.title.trim() || 'курс GoLab'

  const loadCourse = useCallback(async () => {
    if (!parsedCourseId) {
      return
    }

    setIsCourseLoading(true)
    setCourseError(null)

    try {
      const courseData = await getCourseById(parsedCourseId)

      setCourse(courseData)
    } catch {
      setCourse(null)
      setCourseError('Не вдалося завантажити курс. Спробуйте повторити запит.')
    } finally {
      setIsCourseLoading(false)
    }
  }, [parsedCourseId])

  useEffect(() => {
    void Promise.resolve().then(() => loadCourse())
  }, [loadCourse])

  const steps = useMemo(
    () => [
      'Натисніть “Написати в Telegram”.',
      'Напишіть, що хочете купити курс, і вкажіть email акаунта.',
      'Ми надішлемо реквізити для оплати.',
      'Після оплати надішліть підтвердження платежу в Telegram.',
      'Після перевірки ми вручну відкриємо доступ до курсу.',
    ],
    [],
  )

  async function handleCopyEmail() {
    if (!userEmail) {
      return
    }

    setCopyMessage(null)

    try {
      await navigator.clipboard.writeText(userEmail)
      setCopyMessage('Email скопійовано.')
    } catch {
      setCopyMessage('Не вдалося скопіювати автоматично. Email можна виділити вручну.')
    }
  }

  if (!parsedCourseId) {
    return (
      <PageContainer>
        <PurchaseErrorState message="Некоректний ідентифікатор курсу." />
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
          Повернутися до опису курсу
        </Link>

        {isCourseLoading ? (
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <Skeleton className="mb-4 h-7 w-64 bg-slate-800" />
            <Skeleton className="mb-3 h-5 w-full max-w-2xl bg-slate-800" />
            <Skeleton className="h-24 w-full bg-slate-800" />
          </section>
        ) : null}

        {!isCourseLoading && courseError ? (
          <PurchaseErrorState message={courseError} onRetry={loadCourse} />
        ) : null}

        {!isCourseLoading && !courseError && course ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <main className="space-y-6">
              <section className="space-y-3">
                <p className="text-sm font-medium text-cyan-300">
                  Купівля доступу
                </p>
                <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
                  Купівля доступу до курсу
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-400">
                  Купівля доступу до курсу: <span className="text-slate-200">{courseTitle}</span>
                </p>
              </section>

              {!isAuthenticated ? (
                <section className="rounded-xl border border-sky-400/20 bg-slate-900 px-5 py-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
                    Крок 0
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-100">
                    Спочатку увійдіть або створіть акаунт
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    Зареєструйтесь або увійдіть на платформу, щоб ми знали,
                    куди відкривати доступ.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to={loginPath}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    >
                      Увійти
                    </Link>
                    <Link
                      to={registerPath}
                      className="inline-flex h-9 items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    >
                      Зареєструватися
                    </Link>
                  </div>
                </section>
              ) : (
                <section className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-6">
                  <h2 className="text-xl font-semibold text-slate-100">
                    Як отримати доступ
                  </h2>
                  <ol className="mt-5 space-y-4">
                    {steps.map((step, index) => (
                      <li key={step} className="flex gap-3">
                        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                          {index + 1}
                        </span>
                        <div className="min-w-0 text-sm leading-6 text-slate-300">
                          <span>{step}</span>
                          {index === 1 ? (
                            <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                              {userEmail ? (
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="text-sm text-slate-400">
                                    Ваш email:{' '}
                                    <a
                                      href={`mailto:${userEmail}`}
                                      className="font-medium text-cyan-200 hover:text-cyan-100"
                                    >
                                      {userEmail}
                                    </a>
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
                                    onClick={handleCopyEmail}
                                  >
                                    <Copy className="size-4" aria-hidden="true" />
                                    Скопіювати email
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-sm text-amber-200">
                                  Не вдалося показати email. Оновіть сторінку або
                                  скопіюйте email з акаунта вручну.
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>

                  {copyMessage ? (
                    <p className="mt-4 text-sm text-cyan-200">{copyMessage}</p>
                  ) : null}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <a
                      href={TELEGRAM_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    >
                      Написати в Telegram
                    </a>
                    <p className="text-sm leading-6 text-slate-400">
                      Зазвичай доступ відкривається протягом 30 хвилин після
                      підтвердження оплати.
                    </p>
                  </div>
                </section>
              )}
            </main>

            <aside className="h-fit rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm font-medium text-slate-400">Вартість курсу</p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">
                {COURSE_PRICE_UAH} грн
              </p>
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-3 text-sm leading-6 text-cyan-100">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Доступ відкривається вручну після підтвердження оплати.
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </PageContainer>
  )
}
