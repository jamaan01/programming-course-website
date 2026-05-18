import { PageContainer } from '@/components/layout/PageContainer'

export function HomePage() {
  return (
    <PageContainer>
      <section className="space-y-3">
        <p className="text-sm font-medium text-cyan-300">Каталог курсів</p>
        <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
          Курси програмування
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-400">
          Сторінка підготовлена для майбутнього списку курсів.
        </p>
      </section>
    </PageContainer>
  )
}
