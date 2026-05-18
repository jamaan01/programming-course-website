import { PageContainer } from '@/components/layout/PageContainer'

export function ProfilePage() {
  return (
    <PageContainer>
      <section className="space-y-3">
        <p className="text-sm font-medium text-cyan-300">Особистий кабінет</p>
        <h1 className="text-3xl font-semibold text-slate-100">Профіль</h1>
        <p className="max-w-2xl text-base leading-7 text-slate-400">
          Дані профілю та курси користувача будуть додані пізніше.
        </p>
      </section>
    </PageContainer>
  )
}
