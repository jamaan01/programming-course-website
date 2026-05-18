import { useParams } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'

export function LessonPage() {
  const { courseId, lessonId } = useParams()

  return (
    <PageContainer>
      <section className="space-y-3">
        <p className="text-sm font-medium text-cyan-300">
          Курс {courseId}, урок {lessonId}
        </p>
        <h1 className="text-3xl font-semibold text-slate-100">
          Сторінка уроку
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-400">
          Навчальний простір уроку буде доданий пізніше.
        </p>
      </section>
    </PageContainer>
  )
}
