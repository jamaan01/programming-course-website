import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'

const privacySections = [
  {
    title: 'Загальні положення',
    content: [
      'GoLab поважає приватність користувачів і обробляє дані лише для роботи освітньої платформи, доступу до навчання, збереження прогресу та підтримки базової безпеки сервісу.',
      'Ця сторінка описує мінімальні принципи обробки даних для MVP-запуску платформи та не є заміною юридичної консультації.',
    ],
  },
  {
    title: 'Які дані ми можемо обробляти',
    items: [
      'email користувача;',
      'ім’я або інші дані профілю, якщо користувач самостійно їх вказує;',
      'пароль у захищеному вигляді, якщо backend зберігає його для входу в акаунт;',
      'інформацію про курси, уроки та прогрес навчання;',
      'відповіді на тестові питання та результат перевірки знань;',
      'технічні дані, які може обробляти хостинг або сервер: IP-адресу, user-agent, дату і час запиту;',
      'токен авторизації, який може зберігатися у браузері користувача для входу в акаунт.',
    ],
  },
  {
    title: 'Для чого використовуються дані',
    items: [
      'створення та підтримка акаунта;',
      'надання доступу до курсів і уроків;',
      'збереження прогресу навчання;',
      'перевірка відповідей на тестові питання;',
      'покращення роботи платформи;',
      'безпека сервісу та запобігання зловживанням.',
    ],
  },
  {
    title: 'Передача даних третім сторонам',
    content: [
      'GoLab не продає персональні дані користувачів.',
      'Дані можуть оброблятися технічними провайдерами, які забезпечують хостинг, базу даних і роботу сайту. Дані також можуть бути розкриті, якщо цього вимагає закон.',
    ],
  },
  {
    title: 'Зберігання даних',
    content: [
      'Дані зберігаються стільки, скільки потрібно для роботи акаунта, навчального прогресу та платформи.',
      'Користувач може звернутися до GoLab для уточнення, виправлення або видалення даних, якщо це технічно і юридично можливо.',
    ],
  },
  {
    title: 'Захист даних',
    items: [
      'після production deploy використовується HTTPS;',
      'доступ до адмін-функцій обмежений ролями;',
      'паролі, секрети та службові ключі не повинні публікуватися;',
      'абсолютної гарантії безпеки в інтернеті не існує, але GoLab прагне використовувати обережні технічні практики.',
    ],
  },
  {
    title: 'Права користувача',
    content: [
      'Користувач може звернутися на email GoLab, щоб уточнити свої дані, попросити виправлення або попросити видалення акаунта чи даних, якщо це технічно і юридично можливо.',
    ],
  },
  {
    title: 'Контакти',
    content: ['Email: goschoolgolab@gmail.com', 'Phone: +380 97 622 0809'],
  },
]

export function PrivacyPage() {
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
            Політика конфіденційності
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-400">
            Мінімальна політика для MVP-запуску GoLab, освітньої платформи для
            вивчення мови Go.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 text-sm text-slate-300">
        <span className="font-medium text-slate-100">Останнє оновлення:</span>{' '}
        червень 2026
      </div>

      <div className="grid gap-4">
        {privacySections.map((section, index) => (
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
