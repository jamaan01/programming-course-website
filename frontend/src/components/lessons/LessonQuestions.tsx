import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { FormattedMarkdownText } from '@/components/lessons/FormattedLessonContent'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getLessonQuestions,
  submitQuestionAnswer,
} from '@/services/questionService'
import type {
  LessonQuestion,
  LessonQuestionUserAnswer,
  NormalizedApiError,
  SubmitAnswerResponse,
} from '@/types/api'

interface LessonQuestionsProps {
  lessonId: number
  onStatusChange: (status: LessonQuestionsStatus) => void
}

export interface LessonQuestionsStatus {
  hasQuestions: boolean
  allQuestionsCorrect: boolean
}

interface QuestionCardProps {
  question: LessonQuestion
  questionIndex: number
  onAnswerChecked: (allQuestionsCorrect: boolean) => void
}

type AnswerResult = LessonQuestionUserAnswer | SubmitAnswerResponse

const questionsLoadErrorMessage = 'Не вдалося завантажити питання'
const answerSubmitErrorMessage =
  'Не вдалося перевірити відповідь. Спробуйте ще раз.'
const selectOptionMessage = 'Оберіть варіант відповіді'

function isNormalizedApiError(error: unknown): error is NormalizedApiError {
  if (!error || typeof error !== 'object') {
    return false
  }

  return (
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  )
}

function getQuestionsErrorMessage(error: unknown): string {
  if (isNormalizedApiError(error) && error.status === 403) {
    return 'Немає доступу до питань цього уроку.'
  }

  return questionsLoadErrorMessage
}

function getInitialSelectedOptionId(question: LessonQuestion): number | null {
  return question.user_answer?.selected_option_id ?? null
}

function getInitialResult(question: LessonQuestion): AnswerResult | null {
  return question.user_answer ?? null
}

function getQuestionCardKey(question: LessonQuestion): string {
  const answer = question.user_answer

  return `${question.id}-${answer?.selected_option_id ?? 'new'}-${answer?.is_correct ?? 'pending'}`
}

function getOptionCardClass(
  optionId: number,
  selectedOptionId: number | null,
  result: AnswerResult | null,
): string {
  const baseClass =
    'flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-6 transition-colors focus-within:ring-2 focus-within:ring-sky-400 focus-within:ring-offset-2 focus-within:ring-offset-slate-950'

  if (result?.is_correct && optionId === result.selected_option_id) {
    return `${baseClass} border-emerald-500/50 bg-emerald-500/10 text-emerald-100`
  }

  if (result && !result.is_correct && optionId === result.selected_option_id) {
    return `${baseClass} border-rose-500/50 bg-rose-500/10 text-rose-100`
  }

  if (result?.is_correct) {
    return `${baseClass} border-slate-800 bg-slate-950/50 text-slate-400`
  }

  if (optionId === selectedOptionId) {
    return `${baseClass} border-sky-500/70 bg-sky-500/10 text-slate-100`
  }

  return `${baseClass} border-slate-800 bg-slate-950/50 text-slate-300 hover:border-sky-500/40 hover:bg-slate-800/60`
}

function QuestionCard({
  question,
  questionIndex,
  onAnswerChecked,
}: QuestionCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(() =>
    getInitialSelectedOptionId(question),
  )
  const [result, setResult] = useState<AnswerResult | null>(() =>
    getInitialResult(question),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!selectedOptionId) {
      setError(selectOptionMessage)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await submitQuestionAnswer(question.id, {
        option_id: selectedOptionId,
      })

      setSelectedOptionId(response.selected_option_id)
      setResult(response)
      onAnswerChecked(response.all_questions_correct)
    } catch {
      setError(answerSubmitErrorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleReset() {
    setSelectedOptionId(null)
    setResult(null)
    setError(null)
  }

  const isCorrect = Boolean(result?.is_correct)
  const isWrong = Boolean(result && !result.is_correct)

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase text-cyan-300">
            Питання {questionIndex + 1}
          </p>
          <div className="min-w-0 text-slate-100">
            <FormattedMarkdownText content={question.question_text} />
          </div>
        </div>

        {result ? (
          <div
            className={
              result.is_correct
                ? 'inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200'
                : 'inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200'
            }
          >
            {result.is_correct ? (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            ) : (
              <XCircle className="size-4" aria-hidden="true" />
            )}
            {result.is_correct ? 'Правильно' : 'Неправильно'}
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-3" role="radiogroup">
        {question.options.map((option) => (
          <label
            key={option.id}
            className={getOptionCardClass(option.id, selectedOptionId, result)}
          >
            <input
              type="radio"
              className="sr-only"
              name={`lesson-question-${question.id}`}
              value={option.id}
              checked={selectedOptionId === option.id}
              disabled={isSubmitting || isCorrect}
              onChange={() => {
                setSelectedOptionId(option.id)
                setError(null)

                if (isWrong) {
                  setResult(null)
                }
              }}
            />
            <span
              className={
                selectedOptionId === option.id
                  ? 'mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-sky-400 bg-sky-400'
                  : 'mt-1 size-4 shrink-0 rounded-full border border-slate-600 bg-slate-900'
              }
              aria-hidden="true"
            >
              {selectedOptionId === option.id ? (
                <span className="size-1.5 rounded-full bg-slate-950" />
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <FormattedMarkdownText content={option.option_text} compact />
            </div>
          </label>
        ))}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {isCorrect ? (
          <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Зараховано
          </p>
        ) : (
          <Button
            type="button"
            className="bg-sky-500 text-slate-950 hover:bg-sky-400"
            disabled={isSubmitting || !selectedOptionId}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Перевірка...
              </>
            ) : (
              'Перевірити відповідь'
            )}
          </Button>
        )}

        {isWrong ? (
          <Button
            type="button"
            variant="outline"
            className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
            onClick={handleReset}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Спробувати ще раз
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function LessonQuestionsSkeleton() {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <Skeleton className="mb-3 h-5 w-36 bg-slate-800" />
      <Skeleton className="mb-5 h-4 w-2/3 bg-slate-800" />
      <div className="space-y-3">
        <Skeleton className="h-14 w-full bg-slate-800" />
        <Skeleton className="h-14 w-full bg-slate-800" />
        <Skeleton className="h-9 w-44 bg-slate-800" />
      </div>
    </section>
  )
}

export function LessonQuestions({
  lessonId,
  onStatusChange,
}: LessonQuestionsProps) {
  const [questions, setQuestions] = useState<LessonQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setLoadedQuestions = useCallback(
    (loadedQuestions: LessonQuestion[], allQuestionsCorrect: boolean) => {
      setQuestions(loadedQuestions)
      onStatusChange({
        hasQuestions: loadedQuestions.length > 0,
        allQuestionsCorrect,
      })
    },
    [onStatusChange],
  )

  const loadQuestions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getLessonQuestions(lessonId)

      setLoadedQuestions(response.questions, response.all_questions_correct)
    } catch (loadError) {
      setQuestions([])
      setError(getQuestionsErrorMessage(loadError))
      onStatusChange({
        hasQuestions: false,
        allQuestionsCorrect: true,
      })
    } finally {
      setIsLoading(false)
    }
  }, [lessonId, onStatusChange, setLoadedQuestions])

  useEffect(() => {
    let isMounted = true

    void Promise.resolve()
      .then(() => {
        if (!isMounted) {
          return null
        }

        setIsLoading(true)
        setError(null)
        return getLessonQuestions(lessonId)
      })
      .then((response) => {
        if (!isMounted || !response) {
          return
        }

        setLoadedQuestions(response.questions, response.all_questions_correct)
      })
      .catch((loadError) => {
        if (!isMounted) {
          return
        }

        setQuestions([])
        setError(getQuestionsErrorMessage(loadError))
        onStatusChange({
          hasQuestions: false,
          allQuestionsCorrect: true,
        })
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [lessonId, onStatusChange, setLoadedQuestions])

  if (isLoading) {
    return <LessonQuestionsSkeleton />
  }

  if (error) {
    return (
      <section
        className="rounded-xl border border-rose-500/30 bg-slate-900 px-5 py-6"
        role="alert"
      >
        <p className="text-base font-medium text-slate-100">
          Не вдалося завантажити питання
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          {error}
        </p>
        <Button
          type="button"
          className="mt-5 bg-sky-500 text-slate-950 hover:bg-sky-400"
          onClick={loadQuestions}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Спробувати ще раз
        </Button>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-cyan-300">
          Питання до уроку
        </p>
        <p className="text-sm leading-6 text-slate-400">
          Перевір себе після проходження матеріалу.
        </p>
      </div>

      {questions.length === 0 ? (
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-5 text-sm text-slate-400">
          У цьому уроці ще немає питань.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {questions.map((question, index) => (
            <QuestionCard
              key={getQuestionCardKey(question)}
              question={question}
              questionIndex={index}
              onAnswerChecked={(allQuestionsCorrect) =>
                onStatusChange({
                  hasQuestions: true,
                  allQuestionsCorrect,
                })
              }
            />
          ))}
        </div>
      )}
    </section>
  )
}
