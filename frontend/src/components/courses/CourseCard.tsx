import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Course } from '@/types/api'

interface CourseCardProps {
  course: Course
  ctaLabel?: string
}

export function CourseCard({ course, ctaLabel = 'Переглянути курс' }: CourseCardProps) {
  const title = course.title.trim() || 'Курс без назви'
  const description =
    course.description.trim() || 'Опис курсу поки не додано.'

  return (
    <Card className="h-full min-h-60 border border-slate-800 bg-slate-900 text-slate-100 transition-colors hover:border-sky-500/40 hover:bg-slate-900/90">
      <CardHeader className="gap-3">
        <p className="text-xs font-medium text-cyan-300">
          Курс
        </p>
        <CardTitle className="text-xl text-slate-100">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm leading-6 text-slate-400">
          {description}
        </p>
      </CardContent>

      <CardFooter className="border-t border-slate-800 bg-slate-900 px-4 py-4">
        <Link
          to={`/courses/${course.id}`}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          aria-label={`${ctaLabel}: ${title}`}
        >
          {ctaLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  )
}
