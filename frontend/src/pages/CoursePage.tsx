import { useParams } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'

export function CoursePage() {
  const { courseId } = useParams()

  return (
    <PageContainer>
      <section className="space-y-3">
        <p className="text-sm font-medium text-cyan-300">Курс {courseId}</p>
        <h1 className="text-3xl font-semibold text-slate-100">
          Сторінка курсу
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-400">
          Опис курсу, програма та запис на курс будуть додані пізніше.
        </p>
      </section>
    </PageContainer>
  )
}
