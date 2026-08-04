import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Lock,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { CourseAccessLockedCard } from '@/components/courses/CourseAccessLockedCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  checkPracticeTask,
  getLessonPractice,
} from '@/services/practiceService'
import { useAuthStore } from '@/store/authStore'
import type {
  LessonPracticeResponse,
  NormalizedApiError,
  PracticeTask,
} from '@/types/api'

const GO_PLAYGROUND_EMBED_URL = 'https://onecompiler.com/embed/go'
const outputPlaceholder = `Hello GoLab`

interface PracticeDraftUser {
  id?: number | null
  email?: string | null
}

function getPracticeUserScope(user: PracticeDraftUser | null): string | null {
  if (typeof user?.id === 'number' && Number.isFinite(user.id) && user.id > 0) {
    return `user-${user.id}`
  }

  const email = user?.email?.trim().toLowerCase()

  return email ? `email-${encodeURIComponent(email)}` : null
}

function getOutputDraftStorageKey(
  userScope: string,
  lessonId: number,
  taskId: number,
): string {
  return `golab.practice.output.${userScope}.${lessonId}.${taskId}`
}

function getActiveTaskStorageKey(userScope: string, lessonId: number): string {
  return `golab.practice.activeTask.${userScope}.${lessonId}`
}

function getLegacyOutputDraftStorageKey(
  lessonId: number,
  taskId: number,
): string {
  return `golab.practice.output.${lessonId}.${taskId}`
}

function getLegacyActiveTaskStorageKey(lessonId: number): string {
  return `golab.practice.activeTask.${lessonId}`
}

function getStoredValue(key: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function setStoredValue(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Draft persistence is optional; practice still works without localStorage.
  }
}

function removeStoredValue(key: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore unavailable localStorage.
  }
}

function getTaskOutputDraft(
  userScope: string | null,
  lessonId: number,
  taskId: number,
): string {
  if (!userScope) {
    return ''
  }

  return getStoredValue(getOutputDraftStorageKey(userScope, lessonId, taskId)) ?? ''
}

function saveTaskOutputDraft(
  userScope: string | null,
  lessonId: number,
  taskId: number,
  value: string,
): void {
  if (!userScope) {
    return
  }

  setStoredValue(getOutputDraftStorageKey(userScope, lessonId, taskId), value)
}

function saveActiveTaskDraft(
  userScope: string | null,
  lessonId: number,
  taskId: number,
): void {
  if (!userScope) {
    return
  }

  setStoredValue(getActiveTaskStorageKey(userScope, lessonId), String(taskId))
}

function clearActiveTaskDraft(
  userScope: string | null,
  lessonId: number,
): void {
  if (!userScope) {
    return
  }

  removeStoredValue(getActiveTaskStorageKey(userScope, lessonId))
}

function removeLegacyPracticeDrafts(
  lessonId: number,
  tasks: PracticeTask[],
): void {
  removeStoredValue(getLegacyActiveTaskStorageKey(lessonId))

  tasks.forEach((task) => {
    removeStoredValue(getLegacyOutputDraftStorageKey(lessonId, task.id))
  })
}

function parseRouteId(routeId: string | undefined): number | null {
  if (!routeId) {
    return null
  }

  const parsedId = Number(routeId)

  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null
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

function getErrorStatus(error: unknown): number | undefined {
  return isNormalizedApiError(error) ? error.status : undefined
}

function PracticeLoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48 bg-slate-800" />
      <Skeleton className="h-32 w-full bg-slate-800" />
      <Skeleton className="h-[32rem] w-full bg-slate-800" />
    </div>
  )
}

interface PracticeErrorStateProps {
  message: string
  onRetry?: () => void
}

function PracticeErrorState({ message, onRetry }: PracticeErrorStateProps) {
  return (
    <section
      className="rounded-xl border border-rose-500/30 bg-slate-900 px-5 py-6"
      role="alert"
    >
      <p className="text-base font-medium text-slate-100">Сталася помилка</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        {message}
      </p>
      {onRetry ? (
        <Button
          type="button"
          className="mt-5 bg-sky-500 text-slate-950 hover:bg-sky-400"
          onClick={onRetry}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Спробувати ще раз
        </Button>
      ) : null}
    </section>
  )
}

interface PracticeLockedStateProps {
  courseId: number
}

function PracticeLockedState({ courseId }: PracticeLockedStateProps) {
  return (
    <div className="space-y-5">
      <CourseAccessLockedCard purchaseHref={`/courses/${courseId}/buy`} />
      <Link
        to={`/courses/${courseId}`}
        className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Повернутися до курсу
      </Link>
    </div>
  )
}

function getFirstIncompleteTaskIndex(tasks: PracticeTask[]): number {
  const firstIncompleteIndex = tasks.findIndex((task) => !task.isCompleted)

  return firstIncompleteIndex >= 0
    ? firstIncompleteIndex
    : Math.max(tasks.length - 1, 0)
}

function isTaskSelectable(tasks: PracticeTask[], taskIndex: number): boolean {
  const task = tasks[taskIndex]

  if (!task) {
    return false
  }

  if (task.isCompleted) {
    return true
  }

  const firstIncompleteIndex = tasks.findIndex((item) => !item.isCompleted)

  return firstIncompleteIndex === -1 || taskIndex === firstIncompleteIndex
}

function getInitialTaskIndex(
  tasks: PracticeTask[],
  lessonId: number,
  userScope: string | null,
): number {
  const savedTaskId = userScope
    ? Number(getStoredValue(getActiveTaskStorageKey(userScope, lessonId)))
    : Number.NaN
  const savedTaskIndex = tasks.findIndex((task) => task.id === savedTaskId)

  if (savedTaskIndex >= 0 && isTaskSelectable(tasks, savedTaskIndex)) {
    return savedTaskIndex
  }

  return getFirstIncompleteTaskIndex(tasks)
}

function getTaskSelectionState(
  tasks: PracticeTask[],
  taskIndex: number,
  lessonId: number,
  userScope: string | null,
): { taskIndex: number; taskId: number; output: string } | null {
  const task = tasks[taskIndex]

  if (!task || !isTaskSelectable(tasks, taskIndex)) {
    return null
  }

  return {
    taskIndex,
    taskId: task.id,
    output: getTaskOutputDraft(userScope, lessonId, task.id),
  }
}

function getTaskSwitchButtonClass(isActive: boolean, isCompleted: boolean) {
  const baseClass =
    'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed'

  if (isActive) {
    return `${baseClass} border-sky-500/60 bg-sky-500/10 text-sky-100`
  }

  if (isCompleted) {
    return `${baseClass} border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15`
  }

  return `${baseClass} border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900 disabled:text-slate-600 disabled:hover:border-slate-800 disabled:hover:bg-slate-950/60`
}

export function LessonPracticePage() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const parsedCourseId = parseRouteId(courseId)
  const parsedLessonId = parseRouteId(lessonId)
  const user = useAuthStore((state) => state.user)
  const userScope = useMemo(() => getPracticeUserScope(user), [user])
  const lessonHref =
    parsedCourseId && parsedLessonId
      ? `/courses/${parsedCourseId}/lessons/${parsedLessonId}`
      : '/'

  const [practice, setPractice] = useState<LessonPracticeResponse | null>(null)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [output, setOutput] = useState('')
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAccessDenied, setIsAccessDenied] = useState(false)

  const loadPractice = useCallback(async () => {
    if (!parsedLessonId) {
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setIsAccessDenied(false)
    setFeedback(null)
    setOutput('')

    try {
      const response = await getLessonPractice(parsedLessonId)
      const initialTaskIndex = getInitialTaskIndex(
        response.tasks,
        parsedLessonId,
        userScope,
      )
      const initialSelection = getTaskSelectionState(
        response.tasks,
        initialTaskIndex,
        parsedLessonId,
        userScope,
      )

      removeLegacyPracticeDrafts(parsedLessonId, response.tasks)
      setPractice(response)

      if (initialSelection) {
        setCurrentTaskIndex(initialSelection.taskIndex)
        setOutput(initialSelection.output)
        saveActiveTaskDraft(
          userScope,
          parsedLessonId,
          initialSelection.taskId,
        )
      } else {
        setCurrentTaskIndex(0)
        setOutput('')
      }
    } catch (error) {
      setPractice(null)

      if (getErrorStatus(error) === 403) {
        setIsAccessDenied(true)
        return
      }

      setErrorMessage(
        'Не вдалося завантажити практику. Спробуйте повторити запит.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [parsedLessonId, userScope])

  useEffect(() => {
    if (!parsedLessonId) {
      return
    }

    void Promise.resolve().then(() => loadPractice())
  }, [loadPractice, parsedLessonId])

  const tasks = useMemo(() => practice?.tasks ?? [], [practice?.tasks])
  const currentTask = tasks[currentTaskIndex] ?? null
  const completedTaskIdSet = useMemo(
    () => new Set(practice?.completedTaskIds ?? []),
    [practice?.completedTaskIds],
  )
  const tasksWithCompletion = useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        isCompleted: completedTaskIdSet.has(task.id) || task.isCompleted,
      })),
    [completedTaskIdSet, tasks],
  )
  const isCurrentTaskCompleted = currentTask
    ? completedTaskIdSet.has(currentTask.id) || currentTask.isCompleted
    : false
  const hasNextTask = currentTaskIndex < tasks.length - 1
  const isPracticeCompleted =
    practice?.isCompleted ||
    (tasks.length > 0 && completedTaskIdSet.size === tasks.length)

  const selectTask = useCallback(
    (taskIndex: number) => {
      if (!parsedLessonId) {
        return
      }

      const selection = getTaskSelectionState(
        tasksWithCompletion,
        taskIndex,
        parsedLessonId,
        userScope,
      )

      if (!selection) {
        return
      }

      setCurrentTaskIndex(selection.taskIndex)
      saveActiveTaskDraft(userScope, parsedLessonId, selection.taskId)
      setOutput(selection.output)
      setFeedback(null)
    },
    [parsedLessonId, tasksWithCompletion, userScope],
  )

  async function handleCheckOutput() {
    if (!parsedLessonId || !currentTask || !output.trim()) {
      setFeedback({
        tone: 'error',
        message: 'Вставте output програми перед перевіркою.',
      })
      return
    }

    saveTaskOutputDraft(userScope, parsedLessonId, currentTask.id, output)
    setIsChecking(true)
    setFeedback(null)

    try {
      const result = await checkPracticeTask(currentTask.id, output)
      const nextCompletedIds = new Set(result.completedTaskIds)
      const nextTasks = tasks.map((task) => ({
        ...task,
        isCompleted: nextCompletedIds.has(task.id),
      }))

      setPractice((currentPractice) =>
        currentPractice
          ? {
              ...currentPractice,
              tasks: nextTasks,
              completedTaskIds: result.completedTaskIds,
              completedTaskCount: result.completedTaskIds.length,
              isCompleted: result.lessonPracticeCompleted,
            }
          : currentPractice,
      )
      setFeedback({
        tone: result.isCorrect ? 'success' : 'error',
        message: result.message,
      })
    } catch (error) {
      if (getErrorStatus(error) === 403) {
        setIsAccessDenied(true)
        return
      }

      setFeedback({
        tone: 'error',
        message: isNormalizedApiError(error)
          ? error.backendMessage || error.message
          : 'Не вдалося перевірити output. Спробуйте ще раз.',
      })
    } finally {
      setIsChecking(false)
    }
  }

  function handleNextTask() {
    if (!hasNextTask || !isCurrentTaskCompleted) {
      return
    }

    selectTask(currentTaskIndex + 1)
  }

  function handleDone() {
    if (parsedLessonId) {
      clearActiveTaskDraft(userScope, parsedLessonId)
    }

    navigate(lessonHref)
  }

  if (!parsedCourseId || !parsedLessonId) {
    return (
      <PageContainer>
        <PracticeErrorState message="Некоректний ідентифікатор курсу або уроку." />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide">
      <div className="space-y-6">
        <Link
          to={lessonHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 transition-colors hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Повернутися до уроку
        </Link>

        <section className="space-y-3">
          <p className="text-sm font-medium text-cyan-300">Практика</p>
          <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
            Практика
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-400">
            Закріпіть матеріал уроку у практичному завданні та перевірте output
            програми.
          </p>
        </section>

        {isAccessDenied ? <PracticeLockedState courseId={parsedCourseId} /> : null}

        {!isAccessDenied && isLoading ? <PracticeLoadingState /> : null}

        {!isAccessDenied && !isLoading && errorMessage ? (
          <PracticeErrorState message={errorMessage} onRetry={loadPractice} />
        ) : null}

        {!isAccessDenied &&
        !isLoading &&
        !errorMessage &&
        tasks.length === 0 ? (
          <section className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-6">
            <p className="text-base font-medium text-slate-100">
              Практика для цього уроку ще не додана.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Поверніться до уроку та продовжуйте навчання.
            </p>
          </section>
        ) : null}

        {!isAccessDenied &&
        !isLoading &&
        !errorMessage &&
        currentTask ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <main className="min-w-0 space-y-4">
              <section className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-cyan-300">
                      Завдання {currentTaskIndex + 1} з {tasks.length}
                    </p>
                    <h2 className="text-2xl font-semibold text-slate-100">
                      {currentTask.title}
                    </h2>
                    <p className="text-sm leading-7 text-slate-300">
                      {currentTask.description}
                    </p>
                  </div>

                  {isCurrentTaskCompleted ? (
                    <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200">
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      Правильно
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-cyan-300">
                      Стартовий код
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Скопіюйте код у компілятор або використайте власне рішення.
                    </p>
                  </div>
                </div>
                <textarea
                  className="mt-4 min-h-44 w-full resize-y rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none"
                  readOnly
                  value={currentTask.starterCode}
                  aria-label="Стартовий код"
                />
              </section>

              <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                <iframe
                  src={GO_PLAYGROUND_EMBED_URL}
                  title="Go compiler"
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  className="block h-[66svh] min-h-[32rem] w-full border-0 bg-slate-950"
                />
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-5">
                <div className="space-y-2">
                  <label
                    htmlFor="practice-output"
                    className="text-sm font-medium text-slate-200"
                  >
                    Вставте output програми
                  </label>
                  <textarea
                    id="practice-output"
                    className="min-h-32 w-full resize-y rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/40"
                    placeholder={outputPlaceholder}
                    value={output}
                    onChange={(event) => {
                      const nextOutput = event.target.value
                      setOutput(nextOutput)
                      if (currentTask) {
                        saveTaskOutputDraft(
                          userScope,
                          parsedLessonId,
                          currentTask.id,
                          nextOutput,
                        )
                      }
                      setFeedback(null)
                    }}
                    disabled={isChecking}
                  />
                </div>

                {feedback ? (
                  <div
                    className={
                      feedback.tone === 'success'
                        ? 'mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200'
                        : 'mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200'
                    }
                    role="status"
                  >
                    {feedback.tone === 'success' ? (
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                    ) : (
                      <XCircle className="size-4" aria-hidden="true" />
                    )}
                    {feedback.message}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    className="bg-sky-500 text-slate-950 hover:bg-sky-400"
                    disabled={isChecking || !output.trim()}
                    onClick={handleCheckOutput}
                  >
                    {isChecking ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        Перевірка...
                      </>
                    ) : (
                      'Перевірити'
                    )}
                  </Button>

                  {isCurrentTaskCompleted && hasNextTask ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
                      onClick={handleNextTask}
                    >
                      Наступне завдання
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}

                  {isPracticeCompleted && !hasNextTask ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10 hover:text-emerald-100"
                      onClick={handleDone}
                    >
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      Готово
                    </Button>
                  ) : null}
                </div>
              </section>
            </main>

            <aside className="space-y-4 xl:sticky xl:top-8 xl:h-fit">
              <section className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-5">
                <p className="text-sm font-medium text-slate-200">
                  Прогрес практики
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all"
                    style={{
                      width: `${Math.round(
                        ((practice?.completedTaskCount ?? 0) / tasks.length) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Завершено {practice?.completedTaskCount ?? 0} з {tasks.length}
                  {' '}завдань
                </p>

                <div className="mt-5 space-y-2">
                  <p className="text-sm font-medium text-slate-200">
                    Завдання
                  </p>
                  <div className="grid gap-2">
                    {tasksWithCompletion.map((task, index) => {
                      const isCompleted = task.isCompleted
                      const isActive = index === currentTaskIndex
                      const isSelectable = isTaskSelectable(
                        tasksWithCompletion,
                        index,
                      )

                      return (
                        <button
                          key={task.id}
                          type="button"
                          className={getTaskSwitchButtonClass(
                            isActive,
                            isCompleted,
                          )}
                          disabled={!isSelectable}
                          onClick={() => selectTask(index)}
                          aria-current={isActive ? 'step' : undefined}
                        >
                          {isCompleted ? (
                            <CheckCircle2
                              className="size-4"
                              aria-hidden="true"
                            />
                          ) : !isSelectable ? (
                            <Lock className="size-4" aria-hidden="true" />
                          ) : null}
                          Завдання {index + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-5">
                <p className="text-sm font-medium text-cyan-300">
                  Зовнішній компілятор
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Код запускається у зовнішньому середовищі. GoLab перевіряє
                  тільки output, який ви вставляєте у поле.
                </p>
                <a
                  href={GO_PLAYGROUND_EMBED_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Відкрити компілятор
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              </section>
            </aside>
          </div>
        ) : null}
      </div>
    </PageContainer>
  )
}
