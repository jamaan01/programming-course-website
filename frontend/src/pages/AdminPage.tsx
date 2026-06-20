import { zodResolver } from '@hookform/resolvers/zod'
import {
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { PageContainer } from '@/components/layout/PageContainer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  createAdminCourse,
  createAdminLesson,
  createAdminLessonQuestion,
  createAdminModule,
  getAdminCourseSyllabus,
  getAdminCourses,
  getAdminLessonQuestions,
  updateAdminCoursePublishStatus,
} from '@/services/adminService'
import type {
  AdminQuestion,
  Course,
  CourseLesson,
  CourseModule,
  NormalizedApiError,
} from '@/types/api'

const controlClass =
  'border-slate-800 bg-slate-950/70 text-slate-100 placeholder:text-slate-500'
const selectClass =
  'h-8 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-sm text-slate-100 outline-none transition-colors focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-50'
const textareaClass =
  'min-h-36 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm leading-6 text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-50'
const duplicateOrderMessage = 'Цей порядковий номер вже зайнятий'

const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Введіть назву курсу')
    .max(255, 'Назва курсу має бути коротшою'),
  description: z
    .string()
    .trim()
    .min(1, 'Введіть опис курсу')
    .max(2000, 'Опис курсу занадто довгий'),
})

const moduleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Введіть назву модуля')
    .max(255, 'Назва модуля має бути коротшою'),
  order_num: z
    .number({ error: 'Введіть порядок модуля' })
    .int('Порядок має бути цілим числом')
    .min(0, 'Порядок не може бути відʼємним'),
})

const lessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Введіть назву уроку')
    .max(255, 'Назва уроку має бути коротшою'),
  content: z
    .string()
    .trim()
    .min(1, 'Введіть контент уроку')
    .max(10000, 'Контент уроку занадто довгий'),
  order_num: z
    .number({ error: 'Введіть порядок уроку' })
    .int('Порядок має бути цілим числом')
    .min(0, 'Порядок не може бути відʼємним'),
})

const questionSchema = z
  .object({
    question_text: z
      .string()
      .trim()
      .min(1, 'Введіть текст питання')
      .max(2000, 'Текст питання занадто довгий'),
    order_num: z
      .number({ error: 'Введіть порядок питання' })
      .int('Порядок має бути цілим числом')
      .min(0, 'Порядок не може бути відʼємним'),
    options: z
      .array(
        z.object({
          option_text: z
            .string()
            .trim()
            .min(1, 'Введіть варіант відповіді')
            .max(1000, 'Варіант відповіді занадто довгий'),
          is_correct: z.boolean(),
          order_num: z
            .number({ error: 'Введіть порядок варіанта' })
            .int('Порядок має бути цілим числом')
            .min(0, 'Порядок не може бути відʼємним'),
        }),
      )
      .min(2, 'Додайте щонайменше два варіанти відповіді'),
  })
  .superRefine((value, context) => {
    const correctCount = value.options.filter((option) => option.is_correct)
      .length
    const optionOrderNumbers = new Set<number>()

    if (correctCount !== 1) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Має бути рівно одна правильна відповідь',
      })
    }

    value.options.forEach((option, index) => {
      if (optionOrderNumbers.has(option.order_num)) {
        context.addIssue({
          code: 'custom',
          path: ['options', index, 'order_num'],
          message: duplicateOrderMessage,
        })
      }

      optionOrderNumbers.add(option.order_num)
    })
  })

type CourseFormValues = z.infer<typeof courseSchema>
type ModuleFormValues = z.infer<typeof moduleSchema>
type LessonFormValues = z.infer<typeof lessonSchema>
type QuestionFormValues = z.infer<typeof questionSchema>

const defaultQuestionOptions = () => [
  {
    option_text: '',
    is_correct: false,
    order_num: 1,
  },
  {
    option_text: '',
    is_correct: false,
    order_num: 2,
  },
]

interface OrderedItem {
  order_num: number
}

function getNextOrderNumber(items: OrderedItem[]): number {
  const orderNumbers = items
    .map((item) => item.order_num)
    .filter((orderNum) => Number.isFinite(orderNum))

  return orderNumbers.length > 0 ? Math.max(...orderNumbers) + 1 : 1
}

function hasOrderNumber(items: OrderedItem[], orderNum: number | undefined) {
  return (
    typeof orderNum === 'number' &&
    Number.isFinite(orderNum) &&
    items.some((item) => item.order_num === orderNum)
  )
}

function renumberQuestionOptions(options: QuestionFormValues['options']) {
  return options.map((option, index) => ({
    ...option,
    order_num: index + 1,
  }))
}

function getOptionsValidationMessage(optionsError: unknown): string | undefined {
  if (!optionsError || typeof optionsError !== 'object') {
    return undefined
  }

  if (
    'message' in optionsError &&
    typeof (optionsError as { message?: unknown }).message === 'string'
  ) {
    return (optionsError as { message: string }).message
  }

  if (
    'root' in optionsError &&
    optionsError.root &&
    typeof optionsError.root === 'object' &&
    'message' in optionsError.root &&
    typeof (optionsError.root as { message?: unknown }).message === 'string'
  ) {
    return (optionsError.root as { message: string }).message
  }

  return undefined
}

function isNormalizedApiError(error: unknown): error is NormalizedApiError {
  if (!error || typeof error !== 'object') {
    return false
  }

  return (
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  )
}

function getAdminErrorMessage(error: unknown, fallback: string): string {
  if (isNormalizedApiError(error)) {
    if (error.status === 409) {
      return error.backendMessage || duplicateOrderMessage
    }

    if (error.status === 401) {
      return 'Увійдіть в акаунт, щоб працювати з адмін-панеллю.'
    }

    if (error.status === 403) {
      return 'Немає доступу до адмін-панелі.'
    }

    if (error.status === 400) {
      return 'Перевірте введені дані.'
    }
  }

  return fallback
}

function getCourseListFromResponse(response: unknown): Course[] {
  if (!Array.isArray(response)) {
    throw new Error('Unexpected admin courses response shape')
  }

  return response as Course[]
}

function getQuestionListFromResponse(response: unknown): AdminQuestion[] {
  if (!Array.isArray(response)) {
    throw new Error('Unexpected admin questions response shape')
  }

  return response as AdminQuestion[]
}

function parseSelectNumber(value: string): number | null {
  if (!value) {
    return null
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function sortModules(modules: CourseModule[]): CourseModule[] {
  return [...modules].sort((first, second) => first.order_num - second.order_num)
}

function sortLessons(lessons: CourseLesson[]): CourseLesson[] {
  return [...lessons].sort((first, second) => first.order_num - second.order_num)
}

function findModule(modules: CourseModule[], moduleId: number | null) {
  if (!moduleId) {
    return null
  }

  return modules.find((module) => module.id === moduleId) ?? null
}

interface FeedbackMessageProps {
  message: string | null
  tone?: 'success' | 'error'
}

function FeedbackMessage({ message, tone = 'success' }: FeedbackMessageProps) {
  if (!message) {
    return null
  }

  const className =
    tone === 'success'
      ? 'text-emerald-300'
      : 'text-rose-300'

  return (
    <p className={`inline-flex items-center gap-2 text-sm ${className}`}>
      {tone === 'success' ? (
        <CheckCircle2 className="size-4" aria-hidden="true" />
      ) : null}
      {message}
    </p>
  )
}

interface ErrorBlockProps {
  title: string
  message: string
  onRetry?: () => void
}

function ErrorBlock({ title, message, onRetry }: ErrorBlockProps) {
  return (
    <div
      className="rounded-xl border border-rose-500/30 bg-slate-900 px-4 py-5"
      role="alert"
    >
      <p className="font-medium text-slate-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>
      {onRetry ? (
        <Button
          type="button"
          className="mt-4 bg-sky-500 text-slate-950 hover:bg-sky-400"
          onClick={onRetry}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Спробувати ще раз
        </Button>
      ) : null}
    </div>
  )
}

function CourseListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
        >
          <Skeleton className="mb-3 h-5 w-3/5 bg-slate-800" />
          <Skeleton className="mb-3 h-4 w-full bg-slate-800" />
          <Skeleton className="h-8 w-36 bg-slate-800" />
        </div>
      ))}
    </div>
  )
}

interface CourseListProps {
  courses: Course[]
  isLoading: boolean
  error: string | null
  publishingIds: Set<number>
  onRetry: () => void
  onTogglePublish: (course: Course) => void
}

function CourseList({
  courses,
  isLoading,
  error,
  publishingIds,
  onRetry,
  onTogglePublish,
}: CourseListProps) {
  if (isLoading) {
    return <CourseListSkeleton />
  }

  if (error) {
    return (
      <ErrorBlock
        title="Не вдалося завантажити курси"
        message={error}
        onRetry={onRetry}
      />
    )
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-sm text-slate-400">
        Курсів ще немає. Створіть перший курс у формі нижче.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {courses.map((course) => {
        const isPublishing = publishingIds.has(course.id)

        return (
          <div
            key={course.id}
            className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-colors hover:border-sky-500/40"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-100">
                    {course.title}
                  </h3>
                  <Badge
                    className={
                      course.is_published
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                    }
                    variant="outline"
                  >
                    {course.is_published ? 'Опубліковано' : 'Чернетка'}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm leading-6 text-slate-400">
                  {course.description}
                </p>
              </div>

              <Button
                type="button"
                className={
                  course.is_published
                    ? 'border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-slate-100'
                    : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                }
                variant={course.is_published ? 'outline' : 'default'}
                disabled={isPublishing}
                onClick={() => onTogglePublish(course)}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Оновлення...
                  </>
                ) : course.is_published ? (
                  'Зняти з публікації'
                ) : (
                  'Опублікувати'
                )}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function AdminPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isCoursesLoading, setIsCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const [publishingIds, setPublishingIds] = useState<Set<number>>(new Set())
  const [publishMessage, setPublishMessage] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [syllabus, setSyllabus] = useState<Course | null>(null)
  const [isSyllabusLoading, setIsSyllabusLoading] = useState(false)
  const [syllabusError, setSyllabusError] = useState<string | null>(null)
  const [selectedLessonModuleId, setSelectedLessonModuleId] = useState<
    number | null
  >(null)
  const [selectedQuestionModuleId, setSelectedQuestionModuleId] = useState<
    number | null
  >(null)
  const [selectedQuestionLessonId, setSelectedQuestionLessonId] = useState<
    number | null
  >(null)
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false)
  const [questionsError, setQuestionsError] = useState<string | null>(null)

  const [courseSuccess, setCourseSuccess] = useState<string | null>(null)
  const [courseError, setCourseError] = useState<string | null>(null)
  const [moduleSuccess, setModuleSuccess] = useState<string | null>(null)
  const [moduleError, setModuleError] = useState<string | null>(null)
  const [lessonSuccess, setLessonSuccess] = useState<string | null>(null)
  const [lessonError, setLessonError] = useState<string | null>(null)
  const [questionSuccess, setQuestionSuccess] = useState<string | null>(null)
  const [questionError, setQuestionError] = useState<string | null>(null)

  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  const moduleForm = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: '',
      order_num: 0,
    },
  })

  const lessonForm = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      content: '',
      order_num: 0,
    },
  })

  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_text: '',
      order_num: 0,
      options: defaultQuestionOptions(),
    },
  })

  const { fields, append, replace } = useFieldArray({
    control: questionForm.control,
    name: 'options',
  })
  const watchedModuleOrderNum = useWatch({
    control: moduleForm.control,
    name: 'order_num',
  })
  const watchedLessonOrderNum = useWatch({
    control: lessonForm.control,
    name: 'order_num',
  })
  const watchedQuestionOrderNum = useWatch({
    control: questionForm.control,
    name: 'order_num',
  })
  const watchedQuestionOptions =
    useWatch({
      control: questionForm.control,
      name: 'options',
    }) ?? []

  const loadCourses = useCallback(async () => {
    setIsCoursesLoading(true)
    setCoursesError(null)

    try {
      const response: unknown = await getAdminCourses()
      const courseList = getCourseListFromResponse(response)

      setCourses(courseList)
    } catch (error) {
      setCourses([])
      setCoursesError(
        getAdminErrorMessage(
          error,
          'Не вдалося завантажити курси. Спробуйте ще раз.',
        ),
      )
    } finally {
      setIsCoursesLoading(false)
    }
  }, [])

  const loadSyllabus = useCallback(async (courseId: number) => {
    setIsSyllabusLoading(true)
    setSyllabusError(null)

    try {
      const response = await getAdminCourseSyllabus(courseId)

      setSyllabus(response)
    } catch (error) {
      setSyllabus(null)
      setSyllabusError(
        getAdminErrorMessage(
          error,
          'Не вдалося завантажити програму курсу.',
        ),
      )
    } finally {
      setIsSyllabusLoading(false)
    }
  }, [])

  const loadQuestions = useCallback(async (lessonId: number) => {
    setIsQuestionsLoading(true)
    setQuestionsError(null)

    try {
      const response: unknown = await getAdminLessonQuestions(lessonId)
      const questionList = getQuestionListFromResponse(response)

      setQuestions(questionList)
    } catch (error) {
      setQuestions([])
      setQuestionsError(
        getAdminErrorMessage(
          error,
          'Не вдалося завантажити питання уроку.',
        ),
      )
    } finally {
      setIsQuestionsLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => loadCourses())
  }, [loadCourses])

  useEffect(() => {
    if (!selectedCourseId) {
      return
    }

    void Promise.resolve().then(() => loadSyllabus(selectedCourseId))
  }, [loadSyllabus, selectedCourseId])

  useEffect(() => {
    if (!selectedQuestionLessonId) {
      return
    }

    void Promise.resolve().then(() => loadQuestions(selectedQuestionLessonId))
  }, [loadQuestions, selectedQuestionLessonId])

  const modules = useMemo(
    () => sortModules(syllabus?.modules ?? []),
    [syllabus],
  )
  const selectedLessonModule = useMemo(
    () => findModule(modules, selectedLessonModuleId),
    [modules, selectedLessonModuleId],
  )
  const lessonModuleLessons = useMemo(
    () => sortLessons(selectedLessonModule?.lessons ?? []),
    [selectedLessonModule],
  )
  const questionModule = useMemo(
    () => findModule(modules, selectedQuestionModuleId),
    [modules, selectedQuestionModuleId],
  )
  const questionLessons = useMemo(
    () => sortLessons(questionModule?.lessons ?? []),
    [questionModule],
  )
  const moduleOrderDuplicate = hasOrderNumber(modules, watchedModuleOrderNum)
  const lessonOrderDuplicate = hasOrderNumber(
    lessonModuleLessons,
    watchedLessonOrderNum,
  )
  const questionOrderDuplicate = hasOrderNumber(
    questions,
    watchedQuestionOrderNum,
  )

  useEffect(() => {
    if (!selectedCourseId || isSyllabusLoading) {
      return
    }

    void Promise.resolve().then(() => {
      moduleForm.setValue('order_num', getNextOrderNumber(modules), {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      })
    })
  }, [isSyllabusLoading, moduleForm, modules, selectedCourseId])

  useEffect(() => {
    if (!selectedLessonModuleId || isSyllabusLoading) {
      return
    }

    void Promise.resolve().then(() => {
      lessonForm.setValue(
        'order_num',
        getNextOrderNumber(lessonModuleLessons),
        {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: true,
        },
      )
    })
  }, [
    isSyllabusLoading,
    lessonForm,
    lessonModuleLessons,
    selectedLessonModuleId,
  ])

  useEffect(() => {
    if (!selectedQuestionLessonId || isQuestionsLoading) {
      return
    }

    void Promise.resolve().then(() => {
      questionForm.setValue('order_num', getNextOrderNumber(questions), {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      })
    })
  }, [isQuestionsLoading, questionForm, questions, selectedQuestionLessonId])

  function handleSelectedCourseChange(value: string) {
    const courseId = parseSelectNumber(value)

    setSelectedCourseId(courseId)
    setSyllabus(null)
    setSyllabusError(null)
    setSelectedLessonModuleId(null)
    setSelectedQuestionModuleId(null)
    setSelectedQuestionLessonId(null)
    setQuestions([])
    setQuestionsError(null)
  }

  function handleQuestionModuleChange(value: string) {
    setSelectedQuestionModuleId(parseSelectNumber(value))
    setSelectedQuestionLessonId(null)
    setQuestions([])
    setQuestionsError(null)
  }

  function handleQuestionLessonChange(value: string) {
    const lessonId = parseSelectNumber(value)

    setSelectedQuestionLessonId(lessonId)

    if (!lessonId) {
      setQuestions([])
      setQuestionsError(null)
    }
  }

  function handleCorrectOptionChange(selectedIndex: number) {
    const options = questionForm.getValues('options')

    options.forEach((_, optionIndex) => {
      questionForm.setValue(
        `options.${optionIndex}.is_correct`,
        optionIndex === selectedIndex,
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        },
      )
    })

    setQuestionError(null)
    void questionForm.trigger('options')
  }

  function handleAppendQuestionOption() {
    append({
      option_text: '',
      is_correct: false,
      order_num: watchedQuestionOptions.length + 1,
    })
  }

  function handleRemoveQuestionOption(index: number) {
    const nextOptions = renumberQuestionOptions(
      questionForm.getValues('options').filter((_, optionIndex) => {
        return optionIndex !== index
      }),
    )

    replace(nextOptions)
    setQuestionError(null)
    void questionForm.trigger('options')
  }

  async function handleTogglePublish(course: Course) {
    setPublishMessage(null)
    setPublishError(null)
    setPublishingIds((current) => new Set(current).add(course.id))

    try {
      const response = await updateAdminCoursePublishStatus(
        course.id,
        !course.is_published,
      )

      setCourses((currentCourses) =>
        currentCourses.map((item) =>
          item.id === course.id
            ? { ...item, is_published: response.is_published }
            : item,
        ),
      )
      setPublishMessage(
        response.is_published
          ? 'Курс опубліковано.'
          : 'Курс знято з публікації.',
      )
    } catch (error) {
      setPublishError(
        getAdminErrorMessage(
          error,
          'Не вдалося оновити статус курсу. Спробуйте ще раз.',
        ),
      )
    } finally {
      setPublishingIds((current) => {
        const next = new Set(current)
        next.delete(course.id)
        return next
      })
    }
  }

  async function handleCreateCourse(values: CourseFormValues) {
    setCourseSuccess(null)
    setCourseError(null)

    try {
      const response = await createAdminCourse({
        title: values.title.trim(),
        description: values.description.trim(),
      })

      courseForm.reset({
        title: '',
        description: '',
      })
      setCourseSuccess('Курс створено як чернетку.')
      await loadCourses()
      setSelectedCourseId(response.course_id)
    } catch (error) {
      setCourseError(
        getAdminErrorMessage(
          error,
          'Не вдалося створити курс. Спробуйте ще раз.',
        ),
      )
    }
  }

  async function handleCreateModule(values: ModuleFormValues) {
    if (!selectedCourseId) {
      setModuleError('Оберіть курс для нового модуля.')
      return
    }

    setModuleSuccess(null)
    setModuleError(null)

    if (hasOrderNumber(modules, values.order_num)) {
      setModuleError(duplicateOrderMessage)
      return
    }

    try {
      await createAdminModule(selectedCourseId, {
        title: values.title.trim(),
        order_num: values.order_num,
      })

      moduleForm.reset({
        title: '',
        order_num: getNextOrderNumber([
          ...modules,
          { order_num: values.order_num },
        ]),
      })
      setModuleSuccess('Модуль створено.')
      await loadSyllabus(selectedCourseId)
    } catch (error) {
      setModuleError(
        getAdminErrorMessage(
          error,
          'Не вдалося створити модуль. Спробуйте ще раз.',
        ),
      )
    }
  }

  async function handleCreateLesson(values: LessonFormValues) {
    if (!selectedCourseId || !selectedLessonModuleId) {
      setLessonError('Оберіть курс і модуль для нового уроку.')
      return
    }

    setLessonSuccess(null)
    setLessonError(null)

    if (hasOrderNumber(lessonModuleLessons, values.order_num)) {
      setLessonError(duplicateOrderMessage)
      return
    }

    try {
      await createAdminLesson(selectedLessonModuleId, {
        title: values.title.trim(),
        content: values.content.trim(),
        order_num: values.order_num,
      })

      lessonForm.reset({
        title: '',
        content: '',
        order_num: getNextOrderNumber([
          ...lessonModuleLessons,
          { order_num: values.order_num },
        ]),
      })
      setLessonSuccess('Урок створено.')
      await loadSyllabus(selectedCourseId)
    } catch (error) {
      setLessonError(
        getAdminErrorMessage(
          error,
          'Не вдалося створити урок. Спробуйте ще раз.',
        ),
      )
    }
  }

  async function handleCreateQuestion(values: QuestionFormValues) {
    if (!selectedQuestionLessonId) {
      setQuestionError('Оберіть урок для нового питання.')
      return
    }

    setQuestionSuccess(null)
    setQuestionError(null)

    if (hasOrderNumber(questions, values.order_num)) {
      setQuestionError(duplicateOrderMessage)
      return
    }

    const renumberedOptions = renumberQuestionOptions(values.options)

    try {
      await createAdminLessonQuestion(selectedQuestionLessonId, {
        question_text: values.question_text.trim(),
        order_num: values.order_num,
        options: renumberedOptions.map((option) => ({
          option_text: option.option_text.trim(),
          is_correct: option.is_correct,
          order_num: option.order_num,
        })),
      })

      questionForm.reset({
        question_text: '',
        order_num: getNextOrderNumber([
          ...questions,
          { order_num: values.order_num },
        ]),
        options: defaultQuestionOptions(),
      })
      setQuestionSuccess('Питання створено.')
      await loadQuestions(selectedQuestionLessonId)
    } catch (error) {
      setQuestionError(
        getAdminErrorMessage(
          error,
          'Не вдалося створити питання. Спробуйте ще раз.',
        ),
      )
    }
  }

  const hasCourses = courses.length > 0
  const hasModules = modules.length > 0
  const isDependentSelectDisabled = !selectedCourseId || isSyllabusLoading
  const isLessonFormDisabled =
    isDependentSelectDisabled || !selectedLessonModuleId
  const isQuestionLessonSelectDisabled =
    isDependentSelectDisabled || !selectedQuestionModuleId
  const selectedCourseLabel =
    courses.find((course) => course.id === selectedCourseId)?.title ??
    'Оберіть курс'
  const optionsError = questionForm.formState.errors.options
  const optionsErrorMessage = getOptionsValidationMessage(optionsError)

  return (
    <PageContainer width="wide">
      <div className="space-y-8">
        <section className="max-w-3xl space-y-3">
          <p className="text-sm font-medium text-cyan-300">Контент</p>
          <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
            Адмін-панель
          </h1>
          <p className="text-base leading-7 text-slate-400">
            Керуйте курсами, модулями, уроками та питаннями через реальні
            API-методи адмін-частини.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Card className="border border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-300">
                    Курси
                  </p>
                  <CardTitle className="text-xl text-slate-100">
                    Чернетки та публікації
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
                  onClick={loadCourses}
                  disabled={isCoursesLoading}
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Оновити
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CourseList
                courses={courses}
                isLoading={isCoursesLoading}
                error={coursesError}
                publishingIds={publishingIds}
                onRetry={loadCourses}
                onTogglePublish={handleTogglePublish}
              />
              <div className="flex flex-wrap items-center gap-4">
                <FeedbackMessage message={publishMessage} />
                <FeedbackMessage message={publishError} tone="error" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader>
              <p className="text-sm font-medium text-cyan-300">Вибір</p>
              <CardTitle className="text-xl text-slate-100">
                Активний курс
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-course-select" className="text-slate-200">
                  Курс для модуля, уроку та питання
                </Label>
                <select
                  id="admin-course-select"
                  className={selectClass}
                  value={selectedCourseId ?? ''}
                  disabled={isCoursesLoading || !hasCourses}
                  onChange={(event) =>
                    handleSelectedCourseChange(event.target.value)
                  }
                >
                  <option value="">Оберіть курс</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Поточний вибір
                </p>
                <p className="mt-2 text-sm font-medium text-slate-200">
                  {selectedCourseLabel}
                </p>
                {isSyllabusLoading ? (
                  <p className="mt-2 text-sm text-slate-400">
                    Завантаження програми...
                  </p>
                ) : null}
                {syllabusError ? (
                  <p className="mt-2 text-sm text-rose-300">
                    {syllabusError}
                  </p>
                ) : null}
                {selectedCourseId && !isSyllabusLoading && !syllabusError ? (
                  <p className="mt-2 text-sm text-slate-400">
                    Модулів: <span className="text-slate-200">{modules.length}</span>
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader>
              <p className="text-sm font-medium text-cyan-300">Новий курс</p>
              <CardTitle className="text-xl text-slate-100">
                Створити курс
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={courseForm.handleSubmit(handleCreateCourse)}
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="course-title" className="text-slate-200">
                    Назва
                  </Label>
                  <Input
                    id="course-title"
                    className={controlClass}
                    disabled={courseForm.formState.isSubmitting}
                    aria-invalid={Boolean(courseForm.formState.errors.title)}
                    {...courseForm.register('title')}
                  />
                  {courseForm.formState.errors.title ? (
                    <p className="text-sm text-rose-300">
                      {courseForm.formState.errors.title.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-description" className="text-slate-200">
                    Опис
                  </Label>
                  <textarea
                    id="course-description"
                    className="min-h-28 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm leading-6 text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={courseForm.formState.isSubmitting}
                    aria-invalid={Boolean(
                      courseForm.formState.errors.description,
                    )}
                    {...courseForm.register('description')}
                  />
                  {courseForm.formState.errors.description ? (
                    <p className="text-sm text-rose-300">
                      {courseForm.formState.errors.description.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    type="submit"
                    className="bg-sky-500 text-slate-950 hover:bg-sky-400"
                    disabled={courseForm.formState.isSubmitting}
                  >
                    {courseForm.formState.isSubmitting ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        Створення...
                      </>
                    ) : (
                      'Створити курс'
                    )}
                  </Button>
                  <FeedbackMessage message={courseSuccess} />
                  <FeedbackMessage message={courseError} tone="error" />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader>
              <p className="text-sm font-medium text-cyan-300">Новий модуль</p>
              <CardTitle className="text-xl text-slate-100">
                Додати модуль до курсу
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={moduleForm.handleSubmit(handleCreateModule)}
                noValidate
              >
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-400">
                  {selectedCourseId
                    ? `Курс: ${selectedCourseLabel}`
                    : 'Спочатку оберіть курс у блоці вище.'}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="module-title" className="text-slate-200">
                    Назва
                  </Label>
                  <Input
                    id="module-title"
                    className={controlClass}
                    disabled={
                      !selectedCourseId || moduleForm.formState.isSubmitting
                    }
                    aria-invalid={Boolean(moduleForm.formState.errors.title)}
                    {...moduleForm.register('title')}
                  />
                  {moduleForm.formState.errors.title ? (
                    <p className="text-sm text-rose-300">
                      {moduleForm.formState.errors.title.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="module-order" className="text-slate-200">
                    Порядок
                  </Label>
                  <Input
                    id="module-order"
                    type="number"
                    min={0}
                    className={controlClass}
                    disabled={
                      !selectedCourseId || moduleForm.formState.isSubmitting
                    }
                    aria-invalid={Boolean(
                      moduleForm.formState.errors.order_num ||
                        moduleOrderDuplicate,
                    )}
                    {...moduleForm.register('order_num', {
                      valueAsNumber: true,
                    })}
                  />
                  {moduleForm.formState.errors.order_num ? (
                    <p className="text-sm text-rose-300">
                      {moduleForm.formState.errors.order_num.message}
                    </p>
                  ) : null}
                  {!moduleForm.formState.errors.order_num &&
                  moduleOrderDuplicate ? (
                    <p className="text-sm text-rose-300">
                      {duplicateOrderMessage}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    type="submit"
                    className="bg-sky-500 text-slate-950 hover:bg-sky-400"
                    disabled={
                      !selectedCourseId ||
                      moduleForm.formState.isSubmitting ||
                      moduleOrderDuplicate
                    }
                  >
                    {moduleForm.formState.isSubmitting ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        Створення...
                      </>
                    ) : (
                      'Створити модуль'
                    )}
                  </Button>
                  <FeedbackMessage message={moduleSuccess} />
                  <FeedbackMessage message={moduleError} tone="error" />
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader>
              <p className="text-sm font-medium text-cyan-300">Новий урок</p>
              <CardTitle className="text-xl text-slate-100">
                Додати урок до модуля
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={lessonForm.handleSubmit(handleCreateLesson)}
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="lesson-module" className="text-slate-200">
                    Модуль
                  </Label>
                  <select
                    id="lesson-module"
                    className={selectClass}
                    value={selectedLessonModuleId ?? ''}
                    disabled={isDependentSelectDisabled || !hasModules}
                    onChange={(event) =>
                      setSelectedLessonModuleId(
                        parseSelectNumber(event.target.value),
                      )
                    }
                  >
                    <option value="">
                      {isSyllabusLoading
                        ? 'Завантаження...'
                        : hasModules
                          ? 'Оберіть модуль'
                          : 'Немає модулів'}
                    </option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title}
                      </option>
                    ))}
                  </select>
                  {selectedCourseId && !isSyllabusLoading && !hasModules ? (
                    <p className="text-sm text-slate-400">
                      У вибраному курсі ще немає модулів.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-title" className="text-slate-200">
                    Назва
                  </Label>
                  <Input
                    id="lesson-title"
                    className={controlClass}
                    disabled={
                      isLessonFormDisabled || lessonForm.formState.isSubmitting
                    }
                    aria-invalid={Boolean(lessonForm.formState.errors.title)}
                    {...lessonForm.register('title')}
                  />
                  {lessonForm.formState.errors.title ? (
                    <p className="text-sm text-rose-300">
                      {lessonForm.formState.errors.title.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-content" className="text-slate-200">
                    Контент
                  </Label>
                  <textarea
                    id="lesson-content"
                    className={textareaClass}
                    disabled={
                      isLessonFormDisabled || lessonForm.formState.isSubmitting
                    }
                    aria-invalid={Boolean(lessonForm.formState.errors.content)}
                    {...lessonForm.register('content')}
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    Підтримується форматування: # Заголовок, **жирний**, `код`,
                    блок коду через ```go, списки - або 1.,
                    [посилання](https://...).
                  </p>
                  {lessonForm.formState.errors.content ? (
                    <p className="text-sm text-rose-300">
                      {lessonForm.formState.errors.content.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-order" className="text-slate-200">
                    Порядок
                  </Label>
                  <Input
                    id="lesson-order"
                    type="number"
                    min={0}
                    className={controlClass}
                    disabled={
                      isLessonFormDisabled || lessonForm.formState.isSubmitting
                    }
                    aria-invalid={Boolean(
                      lessonForm.formState.errors.order_num ||
                        lessonOrderDuplicate,
                    )}
                    {...lessonForm.register('order_num', {
                      valueAsNumber: true,
                    })}
                  />
                  {lessonForm.formState.errors.order_num ? (
                    <p className="text-sm text-rose-300">
                      {lessonForm.formState.errors.order_num.message}
                    </p>
                  ) : null}
                  {!lessonForm.formState.errors.order_num &&
                  lessonOrderDuplicate ? (
                    <p className="text-sm text-rose-300">
                      {duplicateOrderMessage}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    type="submit"
                    className="bg-sky-500 text-slate-950 hover:bg-sky-400"
                    disabled={
                      isLessonFormDisabled ||
                      lessonForm.formState.isSubmitting ||
                      lessonOrderDuplicate
                    }
                  >
                    {lessonForm.formState.isSubmitting ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        Створення...
                      </>
                    ) : (
                      'Створити урок'
                    )}
                  </Button>
                  <FeedbackMessage message={lessonSuccess} />
                  <FeedbackMessage message={lessonError} tone="error" />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader>
              <p className="text-sm font-medium text-cyan-300">Нове питання</p>
              <CardTitle className="text-xl text-slate-100">
                Додати питання до уроку
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={questionForm.handleSubmit(handleCreateQuestion, () => {
                  setQuestionSuccess(null)
                  setQuestionError('Перевірте поля питання.')
                })}
                noValidate
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="question-module"
                      className="text-slate-200"
                    >
                      Модуль
                    </Label>
                    <select
                      id="question-module"
                      className={selectClass}
                      value={selectedQuestionModuleId ?? ''}
                      disabled={isDependentSelectDisabled || !hasModules}
                      onChange={(event) =>
                        handleQuestionModuleChange(event.target.value)
                      }
                    >
                      <option value="">
                        {isSyllabusLoading
                          ? 'Завантаження...'
                          : hasModules
                            ? 'Оберіть модуль'
                            : 'Немає модулів'}
                      </option>
                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="question-lesson" className="text-slate-200">
                      Урок
                    </Label>
                    <select
                      id="question-lesson"
                      className={selectClass}
                      value={selectedQuestionLessonId ?? ''}
                      disabled={
                        isQuestionLessonSelectDisabled ||
                        questionLessons.length === 0
                      }
                      onChange={(event) =>
                        handleQuestionLessonChange(event.target.value)
                      }
                    >
                      <option value="">
                        {isSyllabusLoading
                          ? 'Завантаження...'
                          : questionLessons.length > 0
                            ? 'Оберіть урок'
                            : 'Немає уроків'}
                      </option>
                      {questionLessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question-text" className="text-slate-200">
                    Текст питання
                  </Label>
                  <textarea
                    id="question-text"
                    className="min-h-24 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm leading-6 text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      !selectedQuestionLessonId ||
                      questionForm.formState.isSubmitting
                    }
                    aria-invalid={Boolean(
                      questionForm.formState.errors.question_text,
                    )}
                    {...questionForm.register('question_text')}
                  />
                  {questionForm.formState.errors.question_text ? (
                    <p className="text-sm text-rose-300">
                      {questionForm.formState.errors.question_text.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question-order" className="text-slate-200">
                    Порядок
                  </Label>
                  <Input
                    id="question-order"
                    type="number"
                    min={0}
                    className={controlClass}
                    disabled={
                      !selectedQuestionLessonId ||
                      questionForm.formState.isSubmitting
                    }
                    aria-invalid={Boolean(
                      questionForm.formState.errors.order_num ||
                        questionOrderDuplicate,
                    )}
                    {...questionForm.register('order_num', {
                      valueAsNumber: true,
                    })}
                  />
                  {questionForm.formState.errors.order_num ? (
                    <p className="text-sm text-rose-300">
                      {questionForm.formState.errors.order_num.message}
                    </p>
                  ) : null}
                  {!questionForm.formState.errors.order_num &&
                  questionOrderDuplicate ? (
                    <p className="text-sm text-rose-300">
                      {duplicateOrderMessage}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Label className="text-slate-200">Варіанти відповіді</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
                      disabled={
                        !selectedQuestionLessonId ||
                        questionForm.formState.isSubmitting
                      }
                      onClick={handleAppendQuestionOption}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Додати варіант
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                      >
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_6rem_auto_auto] md:items-end">
                          <div className="space-y-2">
                            <Label
                              htmlFor={`option-text-${field.id}`}
                              className="text-slate-200"
                            >
                              Варіант
                            </Label>
                            <Input
                              id={`option-text-${field.id}`}
                              className={controlClass}
                              disabled={
                                !selectedQuestionLessonId ||
                                questionForm.formState.isSubmitting
                              }
                              aria-invalid={Boolean(
                                questionForm.formState.errors.options?.[index]
                                  ?.option_text,
                              )}
                              {...questionForm.register(
                                `options.${index}.option_text`,
                              )}
                            />
                            {questionForm.formState.errors.options?.[index]
                              ?.option_text ? (
                              <p className="text-sm text-rose-300">
                                {
                                  questionForm.formState.errors.options[index]
                                    ?.option_text?.message
                                }
                              </p>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor={`option-order-${field.id}`}
                              className="text-slate-200"
                            >
                              Порядок
                            </Label>
                            <Input
                              id={`option-order-${field.id}`}
                              type="number"
                              min={0}
                              readOnly
                              className={`${controlClass} cursor-not-allowed text-slate-400`}
                              disabled={
                                !selectedQuestionLessonId ||
                                questionForm.formState.isSubmitting
                              }
                              aria-invalid={Boolean(
                                questionForm.formState.errors.options?.[index]
                                  ?.order_num,
                              )}
                              {...questionForm.register(
                                `options.${index}.order_num`,
                                {
                                  valueAsNumber: true,
                                },
                              )}
                            />
                            {questionForm.formState.errors.options?.[index]
                              ?.order_num ? (
                              <p className="text-sm text-rose-300">
                                {
                                  questionForm.formState.errors.options[index]
                                    ?.order_num?.message
                                }
                              </p>
                            ) : null}
                          </div>

                          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                            <input
                              type="radio"
                              name="correct-option"
                              className="size-4 border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
                              checked={Boolean(
                                watchedQuestionOptions[index]?.is_correct,
                              )}
                              disabled={
                                !selectedQuestionLessonId ||
                                questionForm.formState.isSubmitting
                              }
                              onChange={() => handleCorrectOptionChange(index)}
                            />
                            Правильна
                          </label>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
                            disabled={
                              fields.length <= 2 ||
                              questionForm.formState.isSubmitting
                            }
                            onClick={() => handleRemoveQuestionOption(index)}
                            aria-label="Видалити варіант"
                          >
                            <X className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {optionsErrorMessage ? (
                    <p className="text-sm text-rose-300">
                      {optionsErrorMessage}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    type="submit"
                    className="bg-sky-500 text-slate-950 hover:bg-sky-400"
                    disabled={
                      !selectedQuestionLessonId ||
                      questionForm.formState.isSubmitting ||
                      questionOrderDuplicate
                    }
                  >
                    {questionForm.formState.isSubmitting ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        Створення...
                      </>
                    ) : (
                      'Створити питання'
                    )}
                  </Button>
                  <FeedbackMessage message={questionSuccess} />
                  <FeedbackMessage message={questionError} tone="error" />
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader>
              <p className="text-sm font-medium text-cyan-300">Програма</p>
              <CardTitle className="text-xl text-slate-100">
                Модулі вибраного курсу
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedCourseId ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-sm text-slate-400">
                  Оберіть курс, щоб побачити його програму.
                </div>
              ) : null}

              {isSyllabusLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full bg-slate-800" />
                  <Skeleton className="h-14 w-full bg-slate-800" />
                </div>
              ) : null}

              {!isSyllabusLoading && selectedCourseId && syllabusError ? (
                <ErrorBlock
                  title="Не вдалося завантажити програму"
                  message={syllabusError}
                  onRetry={() => loadSyllabus(selectedCourseId)}
                />
              ) : null}

              {!isSyllabusLoading &&
              selectedCourseId &&
              !syllabusError &&
              !hasModules ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-sm text-slate-400">
                  У цьому курсі ще немає модулів.
                </div>
              ) : null}

              {!isSyllabusLoading &&
              selectedCourseId &&
              !syllabusError &&
              hasModules ? (
                <div className="space-y-3">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-100">
                          {module.title}
                        </p>
                        <Badge
                          variant="outline"
                          className="border-slate-700 text-slate-300"
                        >
                          #{module.order_num}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        Уроків:{' '}
                        <span className="text-slate-200">
                          {module.lessons?.length ?? 0}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader>
              <p className="text-sm font-medium text-cyan-300">Питання</p>
              <CardTitle className="text-xl text-slate-100">
                Питання вибраного уроку
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedQuestionLessonId ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-sm text-slate-400">
                  Оберіть урок у формі питання, щоб переглянути створені
                  питання.
                </div>
              ) : null}

              {isQuestionsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full bg-slate-800" />
                  <Skeleton className="h-16 w-full bg-slate-800" />
                </div>
              ) : null}

              {!isQuestionsLoading &&
              selectedQuestionLessonId &&
              questionsError ? (
                <ErrorBlock
                  title="Не вдалося завантажити питання"
                  message={questionsError}
                  onRetry={() => loadQuestions(selectedQuestionLessonId)}
                />
              ) : null}

              {!isQuestionsLoading &&
              selectedQuestionLessonId &&
              !questionsError &&
              questions.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-sm text-slate-400">
                  У цьому уроці ще немає питань.
                </div>
              ) : null}

              {!isQuestionsLoading &&
              selectedQuestionLessonId &&
              !questionsError &&
              questions.length > 0 ? (
                <div className="space-y-3">
                  {questions.map((question) => (
                    <div
                      key={question.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-100">
                          {question.question_text}
                        </p>
                        <Badge
                          variant="outline"
                          className="border-slate-700 text-slate-300"
                        >
                          #{question.order_num}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        Варіантів:{' '}
                        <span className="text-slate-200">
                          {question.options.length}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </PageContainer>
  )
}
