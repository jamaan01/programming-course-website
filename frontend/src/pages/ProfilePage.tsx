import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { CourseCard } from '@/components/courses/CourseCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getProfile,
  getProfileCourses,
  updateProfile,
} from '@/services/profileService'
import { useAuthStore } from '@/store/authStore'
import type { Course, NormalizedApiError, ProfileResponse } from '@/types/api'

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Введіть імʼя')
    .min(2, 'Імʼя має містити щонайменше 2 символи')
    .max(50, 'Імʼя має містити не більше 50 символів'),
  email: z
    .string()
    .trim()
    .min(1, 'Введіть електронну пошту')
    .email('Введіть коректну електронну пошту'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

function isNormalizedApiError(error: unknown): error is NormalizedApiError {
  if (!error || typeof error !== 'object') {
    return false
  }

  return (
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  )
}

function getProfileLoadErrorMessage(error: unknown): string {
  if (!isNormalizedApiError(error)) {
    return 'Не вдалося завантажити профіль. Спробуйте ще раз.'
  }

  if (error.status === 401) {
    return 'Увійдіть в акаунт, щоб переглянути профіль.'
  }

  return 'Не вдалося завантажити профіль. Спробуйте ще раз.'
}

function getProfileUpdateErrorMessage(error: unknown): string {
  if (!isNormalizedApiError(error)) {
    return 'Не вдалося оновити профіль. Спробуйте ще раз.'
  }

  if (error.status === 400) {
    return 'Перевірте імʼя та електронну пошту.'
  }

  if (error.status === 409) {
    return 'Користувач з такою електронною поштою вже існує.'
  }

  return 'Не вдалося оновити профіль. Спробуйте ще раз.'
}

function getCoursesLoadErrorMessage(error: unknown): string {
  if (isNormalizedApiError(error) && error.status === 401) {
    return 'Увійдіть в акаунт, щоб переглянути свої курси.'
  }

  return 'Не вдалося завантажити ваші курси. Спробуйте ще раз.'
}

function formatProfileDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Немає даних'
  }

  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getCourseListFromResponse(response: unknown): Course[] {
  if (!Array.isArray(response)) {
    throw new Error('Unexpected profile courses response shape')
  }

  return response as Course[]
}

function ProfileLoadingState() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <Skeleton className="h-5 w-32 bg-slate-800" />
          <Skeleton className="h-8 w-56 bg-slate-800" />
        </CardHeader>
        <CardContent className="space-y-5">
          <Skeleton className="h-10 w-full bg-slate-800" />
          <Skeleton className="h-10 w-full bg-slate-800" />
          <Skeleton className="h-9 w-40 bg-slate-800" />
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <Skeleton className="h-5 w-28 bg-slate-800" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-full bg-slate-800" />
          <Skeleton className="h-5 w-4/5 bg-slate-800" />
          <Skeleton className="h-5 w-3/4 bg-slate-800" />
        </CardContent>
      </Card>
    </div>
  )
}

function CoursesLoadingState() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((item) => (
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
            <Skeleton className="h-9 w-44 bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface ErrorStateProps {
  title: string
  message: string
  onRetry: () => void
}

function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="rounded-xl border border-rose-500/30 bg-slate-900 px-5 py-6 text-slate-300"
      role="alert"
    >
      <p className="text-base font-medium text-slate-100">{title}</p>
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

interface ProfileSummaryProps {
  profile: ProfileResponse
}

function ProfileSummary({ profile }: ProfileSummaryProps) {
  return (
    <Card className="border border-slate-800 bg-slate-900 text-slate-100">
      <CardHeader>
        <p className="text-sm font-medium text-cyan-300">Ваш акаунт</p>
        <CardTitle className="text-xl text-slate-100">
          {profile.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-400">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 size-4 text-cyan-300" aria-hidden="true" />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Електронна пошта
            </p>
            <p className="break-all text-slate-200">{profile.email}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CalendarDays
            className="mt-0.5 size-4 text-cyan-300"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Створено
            </p>
            <p className="text-slate-200">
              {formatProfileDate(profile.created_at)}
            </p>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
            Мотивація
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Не чекай ідеального моменту. Запуш сьогодні.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProfilePage() {
  const authUser = useAuthStore((state) => state.user)
  const loadAuthProfile = useAuthStore((state) => state.loadProfile)

  const [profile, setProfile] = useState<ProfileResponse | null>(authUser)
  const [courses, setCourses] = useState<Course[]>([])
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isCoursesLoading, setIsCoursesLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: authUser?.name ?? '',
      email: authUser?.email ?? '',
    },
  })

  const loadProfileData = useCallback(async () => {
    setIsProfileLoading(true)
    setProfileError(null)

    try {
      const response = await getProfile()
      setProfile(response)
      reset({
        name: response.name,
        email: response.email,
      })
    } catch (error) {
      setProfileError(getProfileLoadErrorMessage(error))
    } finally {
      setIsProfileLoading(false)
    }
  }, [reset])

  const loadCourses = useCallback(async () => {
    setIsCoursesLoading(true)
    setCoursesError(null)

    try {
      const response: unknown = await getProfileCourses()
      const courseList = getCourseListFromResponse(response)
      setCourses(courseList)
    } catch (error) {
      setCourses([])
      setCoursesError(getCoursesLoadErrorMessage(error))
    } finally {
      setIsCoursesLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    void Promise.resolve().then(() => {
      if (!isMounted) {
        return
      }

      void loadProfileData()
      void loadCourses()
    })

    return () => {
      isMounted = false
    }
  }, [loadCourses, loadProfileData])

  async function onSubmit(values: ProfileFormValues) {
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
    }

    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      await updateProfile(payload)

      setProfile((currentProfile) =>
        currentProfile
          ? {
              ...currentProfile,
              ...payload,
            }
          : currentProfile,
      )
      reset(payload)
      setSubmitSuccess('Профіль оновлено.')

      await loadAuthProfile()
    } catch (error) {
      setSubmitError(getProfileUpdateErrorMessage(error))
    }
  }

  const hasCourses = courses.length > 0

  return (
    <PageContainer>
      <div className="space-y-8">
        <section className="max-w-3xl space-y-3">
          <p className="text-sm font-medium text-cyan-300">
            Особистий кабінет
          </p>
          <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
            Профіль
          </h1>
          <p className="text-base leading-7 text-slate-400">
            Керуйте базовими даними акаунта та швидко повертайтеся до своїх
            курсів.
          </p>
        </section>

        {isProfileLoading ? <ProfileLoadingState /> : null}

        {!isProfileLoading && profileError && !profile ? (
          <ErrorState
            title="Не вдалося завантажити профіль"
            message={profileError}
            onRetry={loadProfileData}
          />
        ) : null}

        {!isProfileLoading && profile ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Card className="border border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <p className="text-sm font-medium text-cyan-300">
                  Редагування профілю
                </p>
                <CardTitle className="text-xl text-slate-100">
                  Особисті дані
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5"
                  noValidate
                >
                  {profileError ? (
                    <div
                      className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
                      role="alert"
                    >
                      {profileError}
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">
                      Імʼя
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      className="border-slate-800 bg-slate-950/70 text-slate-100"
                      aria-invalid={Boolean(errors.name)}
                      disabled={isSubmitting}
                      {...register('name')}
                    />
                    {errors.name ? (
                      <p className="text-sm text-rose-300">
                        {errors.name.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">
                      Електронна пошта
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="border-slate-800 bg-slate-950/70 text-slate-100"
                      aria-invalid={Boolean(errors.email)}
                      disabled={isSubmitting}
                      {...register('email')}
                    />
                    {errors.email ? (
                      <p className="text-sm text-rose-300">
                        {errors.email.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <Button
                      type="submit"
                      className="bg-sky-500 text-slate-950 hover:bg-sky-400"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                          Збереження...
                        </>
                      ) : (
                        'Зберегти зміни'
                      )}
                    </Button>

                    {submitSuccess ? (
                      <p className="inline-flex items-center gap-2 text-sm text-emerald-300">
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                        {submitSuccess}
                      </p>
                    ) : null}
                  </div>

                  {submitError ? (
                    <p className="text-sm text-rose-300" role="alert">
                      {submitError}
                    </p>
                  ) : null}
                </form>
              </CardContent>
            </Card>

            <ProfileSummary profile={profile} />
          </section>
        ) : null}

        <section className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-cyan-300">Навчання</p>
              <h2 className="text-2xl font-semibold text-slate-100">
                Мої курси
              </h2>
            </div>
            {!isCoursesLoading && !coursesError && hasCourses ? (
              <p className="text-sm text-slate-400">
                Курсів: <span className="text-slate-200">{courses.length}</span>
              </p>
            ) : null}
          </div>

          {isCoursesLoading ? <CoursesLoadingState /> : null}

          {!isCoursesLoading && coursesError ? (
            <ErrorState
              title="Не вдалося завантажити курси"
              message={coursesError}
              onRetry={loadCourses}
            />
          ) : null}

          {!isCoursesLoading && !coursesError && !hasCourses ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-8 text-center">
              <p className="text-base text-slate-300">
                У вас ще немає курсів.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Перейдіть до каталогу та оберіть курс для навчання.
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex h-9 items-center justify-center rounded-lg bg-sky-500 px-3 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Перейти до каталогу
              </Link>
            </div>
          ) : null}

          {!isCoursesLoading && !coursesError && hasCourses ? (
            <div
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              aria-label="Мої курси"
            >
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  ctaLabel="Продовжити навчання"
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </PageContainer>
  )
}
