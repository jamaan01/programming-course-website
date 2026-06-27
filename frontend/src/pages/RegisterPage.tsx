import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'

const passwordPattern = /^[\x21-\x7E]+$/
const passwordPatternMessage =
  'Пароль може містити лише латинські літери, цифри та символи без пробілів'

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Введіть ім’я')
    .min(2, 'Ім’я має містити щонайменше 2 символи'),
  email: z
    .string()
    .trim()
    .min(1, 'Введіть електронну пошту')
    .email('Введіть коректну електронну пошту'),
  password: z
    .string()
    .min(1, 'Введіть пароль')
    .min(6, 'Пароль має містити щонайменше 6 символів')
    .regex(passwordPattern, passwordPatternMessage),
})

type RegisterFormValues = z.infer<typeof registerSchema>

function getRegisterErrorMessage(authError: {
  status?: number
  message: string
}) {
  if (authError.status === 409) {
    return 'Користувач з такою електронною поштою вже існує'
  }

  if (authError.status === 400) {
    return 'Перевірте введені дані та спробуйте ще раз'
  }

  return authError.message
}

function getSafeRedirectPath(value: string | null): string | null {
  if (!value) {
    return null
  }

  const redirect = value.trim()

  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return null
  }

  return redirect
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const registerUser = useAuthStore((state) => state.register)
  const clearError = useAuthStore((state) => state.clearError)
  const authStatus = useAuthStore((state) => state.authStatus)
  const isLoading = useAuthStore((state) => state.isLoading)
  const authError = useAuthStore((state) => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })
  const redirectPath = getSafeRedirectPath(searchParams.get('redirect'))
  const successPath = redirectPath ?? '/profile'
  const loginPath = redirectPath
    ? `/login?redirect=${encodeURIComponent(redirectPath)}`
    : '/login'

  useEffect(() => {
    clearError()
  }, [clearError])

  useEffect(() => {
    if (authStatus === 'authenticated') {
      navigate(successPath, { replace: true })
    }
  }, [authStatus, navigate, successPath])

  async function onSubmit(values: RegisterFormValues) {
    await registerUser(values)

    if (useAuthStore.getState().authStatus === 'authenticated') {
      navigate(successPath, { replace: true })
    }
  }

  const isPending = isLoading || isSubmitting
  const registerErrorMessage = authError
    ? getRegisterErrorMessage(authError)
    : null

  return (
    <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100 shadow-2xl shadow-slate-950/30">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Зареєструватися</CardTitle>
        <CardDescription className="text-slate-400">
          Створіть акаунт, щоб зберігати прогрес навчання.
        </CardDescription>
      </CardHeader>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col px-6 pb-6"
        noValidate
      >
        <div className="space-y-5">
          {authError ? (
            <div
              className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
              role="alert"
            >
              {registerErrorMessage}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-200">
              Ім’я
            </Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              className="border-slate-800 bg-slate-950/70 text-slate-100"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name ? (
              <p className="text-sm text-rose-300">{errors.name.message}</p>
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
              placeholder="name@example.com"
              className="border-slate-800 bg-slate-950/70 text-slate-100 placeholder:text-slate-500"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email ? (
              <p className="text-sm text-rose-300">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">
              Пароль
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              className="border-slate-800 bg-slate-950/70 text-slate-100"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-sm text-rose-300">{errors.password.message}</p>
            ) : null}
          </div>
        </div>

        <Button type="submit" className="mt-8 w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Зачекайте...
              </>
            ) : (
              'Зареєструватися'
            )}
        </Button>

          <p className="mt-8 text-center text-sm text-slate-400">
            Вже маєте акаунт?{' '}
            <Link
              to={loginPath}
              className="font-medium text-sky-300 hover:text-sky-200"
            >
              Увійти
            </Link>
          </p>
      </form>
    </Card>
  )
}
