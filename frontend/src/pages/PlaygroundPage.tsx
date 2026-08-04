import { ArrowLeft, ExternalLink, Info, ShieldAlert } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'

const GO_PLAYGROUND_EMBED_URL = 'https://onecompiler.com/embed/go'
const SAFE_RETURN_ORIGIN = 'https://golab.local'

function getSafeReturnPath(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const returnTo = value.trim()

  if (!returnTo.startsWith('/courses/') || returnTo.startsWith('//')) {
    return null
  }

  try {
    const url = new URL(returnTo, SAFE_RETURN_ORIGIN)

    if (url.origin !== SAFE_RETURN_ORIGIN) {
      return null
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export default function PlaygroundPage() {
  const location = useLocation()
  const returnTo = getSafeReturnPath(
    (location.state as { returnTo?: unknown } | null)?.returnTo,
  )
  const backLinkHref = returnTo ?? '/'
  const backLinkText = returnTo
    ? 'Повернутися до уроку'
    : 'Повернутися до курсів'

  return (
    <PageContainer width="wide">
      <div className="space-y-6">
        <Link
          to={backLinkHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 transition-colors hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {backLinkText}
        </Link>

        <section className="space-y-3">
          <p className="text-sm font-medium text-cyan-300">Практика Go</p>
          <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
            Go Playground
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-400">
            Пишіть Go-код, запускайте приклади та перевіряйте результат прямо в
            браузері.
          </p>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <main className="min-w-0 space-y-4">
            <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <iframe
                src={GO_PLAYGROUND_EMBED_URL}
                title="Go compiler"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                className="block h-[70svh] min-h-[34rem] w-full border-0 bg-slate-950"
              />
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/70 px-5 py-4">
              <p className="text-sm leading-6 text-slate-400">
                Якщо редактор не завантажився, відкрийте компілятор у новій
                вкладці.
              </p>
              <a
                href={GO_PLAYGROUND_EMBED_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Відкрити компілятор
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </section>
          </main>

          <aside className="space-y-4">
            <section className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-5">
              <div className="flex gap-3">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 text-cyan-200">
                  <Info className="size-4" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-cyan-300">
                    Тимчасовий runner
                  </p>
                  <p className="text-sm leading-6 text-slate-400">
                    Це тимчасовий зовнішній компілятор для практики. Пізніше ми
                    додамо власний runner GoLab.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-amber-400/25 bg-slate-900 px-5 py-5">
              <div className="flex gap-3">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-200">
                  <ShieldAlert className="size-4" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-200">
                    Без секретних даних
                  </p>
                  <p className="text-sm leading-6 text-slate-400">
                    Не вставляйте приватні ключі, паролі або секретні дані. Код
                    виконується у зовнішньому середовищі.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </PageContainer>
  )
}
