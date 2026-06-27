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

const loginSchema = z.object({
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

type LoginFormValues = z.infer<typeof loginSchema>

function getLoginErrorMessage(authError: { status?: number; message: string }) {
  if (authError.status === 401 || authError.status === 403) {
    return 'Невірна електронна пошта або пароль'
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

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const clearError = useAuthStore((state) => state.clearError)
  const authStatus = useAuthStore((state) => state.authStatus)
  const isLoading = useAuthStore((state) => state.isLoading)
  const authError = useAuthStore((state) => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  const redirectPath = getSafeRedirectPath(searchParams.get('redirect'))
  const successPath = redirectPath ?? '/profile'
  const registerPath = redirectPath
    ? `/register?redirect=${encodeURIComponent(redirectPath)}`
    : '/register'

  useEffect(() => {
    clearError()
  }, [clearError])

  useEffect(() => {
    if (authStatus === 'authenticated') {
      navigate(successPath, { replace: true })
    }
  }, [authStatus, navigate, successPath])

  async function onSubmit(values: LoginFormValues) {
    await login(values)

    if (useAuthStore.getState().authStatus === 'authenticated') {
      navigate(successPath, { replace: true })
    }
  }

  const isPending = isLoading || isSubmitting
  const loginErrorMessage = authError ? getLoginErrorMessage(authError) : null

  return (
    <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100 shadow-2xl shadow-slate-950/30">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Увійти</CardTitle>
        <CardDescription className="text-slate-400">
          Введіть дані акаунту, щоб продовжити навчання.
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
              {loginErrorMessage}
            </div>
          ) : null}

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
              autoComplete="current-password"
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
              'Увійти'
            )}
        </Button>

          <p className="mt-8 text-center text-sm text-slate-400">
            Ще не маєте акаунту?{' '}
            <Link
              to={registerPath}
              className="font-medium text-sky-300 hover:text-sky-200"
            >
              Зареєструватися
            </Link>
          </p>
      </form>
    </Card>
  )
}
