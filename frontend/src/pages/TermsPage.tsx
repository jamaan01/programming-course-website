import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'

const termsSections = [
  {
    title: 'Загальні умови',
    content: [
      'GoLab — освітня платформа для навчання програмуванню мовою Go. Використовуючи платформу, користувач погоджується з цими умовами в межах доступної функціональності MVP.',
      'Ці умови описують базові правила користування сервісом і не створюють юридичних гарантій, які платформа фактично не надає.',
    ],
  },
  {
    title: 'Акаунт користувача',
    items: [
      'користувач відповідає за коректність даних, які вказує під час реєстрації або редагування профілю;',
      'користувач має зберігати доступ до акаунта безпечно;',
      'не можна передавати доступ до акаунта третім особам, якщо це порушує роботу платформи або права інших користувачів.',
    ],
  },
  {
    title: 'Навчальний контент',
    items: [
      'матеріали надаються для освітніх цілей;',
      'GoLab може оновлювати уроки, тести та функціональність платформи;',
      'результат навчання залежить від зусиль користувача, регулярності практики та самостійної роботи;',
      'GoLab не гарантує працевлаштування або конкретний рівень доходу.',
    ],
  },
  {
    title: 'Заборонені дії',
    items: [
      'намагатися отримати несанкціонований доступ до акаунтів, адмін-панелі, API або бази даних;',
      'заважати роботі сайту або інших користувачів;',
      'автоматично перевантажувати сервер запитами;',
      'копіювати або поширювати матеріали без дозволу;',
      'використовувати платформу для незаконних дій.',
    ],
  },
  {
    title: 'Доступність сервісу',
    content: [
      'Сервіс може тимчасово бути недоступним через технічні роботи, оновлення або проблеми провайдерів.',
      'GoLab намагається підтримувати стабільну роботу платформи, але не гарантує безперервну доступність.',
    ],
  },
  {
    title: 'Зміни умов',
    content: [
      'GoLab може оновлювати ці умови. Актуальна версія доступна на сайті.',
    ],
  },
  {
    title: 'Контакти',
    content: ['Email: goschoolgolab@gmail.com', 'Phone: +380 97 622 00 89'],
  },
]

export function TermsPage() {
  return (
    <PageContainer className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          На головну
        </Link>

        <div className="space-y-3">
          <p className="text-sm font-medium text-cyan-300">Правова інформація</p>
          <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
            Умови використання
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-400">
            Базові правила користування GoLab для MVP-запуску освітньої
            платформи.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 text-sm text-slate-300">
        <span className="font-medium text-slate-100">Останнє оновлення:</span>{' '}
        червень 2026
      </div>

      <div className="grid gap-4">
        {termsSections.map((section, index) => (
          <section
            key={section.title}
            className="rounded-xl border border-slate-800 bg-slate-900 p-5"
          >
            <h2 className="text-lg font-semibold text-slate-100">
              {index + 1}. {section.title}
            </h2>

            {section.content ? (
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-300">
                {section.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}

            {section.items ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-300">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </PageContainer>
  )
}
