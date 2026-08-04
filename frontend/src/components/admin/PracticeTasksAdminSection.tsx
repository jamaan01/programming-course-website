import { Loader2, Pencil, Plus, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
  createAdminLessonPracticeTask,
  getAdminLessonPracticeTasks,
  updateAdminPracticeTask,
} from '@/services/adminService'
import type {
  AdminPracticeTask,
  CourseLesson,
  CourseModule,
  CreatePracticeTaskPayload,
  NormalizedApiError,
} from '@/types/api'

const controlClass =
  'border-slate-800 bg-slate-950/70 text-slate-100 placeholder:text-slate-500'
const selectClass =
  'h-8 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-sm text-slate-100 outline-none transition-colors focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-50'
const textareaBaseClass =
  'w-full resize-y rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm leading-6 text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-50'

interface PracticeTasksAdminSectionProps {
  modules: CourseModule[]
  isSyllabusLoading: boolean
  hasModules: boolean
  isDisabled: boolean
}

type PracticeTaskDraft = CreatePracticeTaskPayload

const emptyTaskDraft: PracticeTaskDraft = {
  title: '',
  description: '',
  starterCode: '',
  expectedOutput: '',
  orderNum: 1,
  isActive: true,
}

function sortLessons(lessons: CourseLesson[] = []): CourseLesson[] {
  return [...lessons].sort((first, second) => first.order_num - second.order_num)
}

function getNextOrderNumber(tasks: AdminPracticeTask[]): number {
  const orders = tasks
    .map((task) => task.orderNum)
    .filter((orderNum) => Number.isFinite(orderNum))

  return orders.length > 0 ? Math.max(...orders) + 1 : 1
}

function parseSelectNumber(value: string): number | null {
  if (!value) {
    return null
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
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
      return error.backendMessage || 'Цей порядковий номер вже зайнятий'
    }

    if (error.status === 400) {
      return error.backendMessage || 'Перевірте дані практичного завдання.'
    }

    if (error.status === 403) {
      return 'Немає доступу до адмін-панелі.'
    }
  }

  return fallback
}

function toTaskDraft(task: AdminPracticeTask): PracticeTaskDraft {
  return {
    title: task.title,
    description: task.description,
    starterCode: task.starterCode,
    expectedOutput: task.expectedOutput,
    orderNum: task.orderNum,
    isActive: task.isActive,
  }
}

function validateDraft(draft: PracticeTaskDraft): string | null {
  if (!draft.title.trim()) {
    return 'Введіть назву практичного завдання.'
  }

  if (!draft.description.trim()) {
    return 'Введіть опис завдання.'
  }

  if (!draft.expectedOutput.trim()) {
    return 'Введіть очікуваний output.'
  }

  if (!Number.isInteger(draft.orderNum) || draft.orderNum <= 0) {
    return 'Порядок має бути цілим числом більше 0.'
  }

  return null
}

export function PracticeTasksAdminSection({
  modules,
  isSyllabusLoading,
  hasModules,
  isDisabled,
}: PracticeTasksAdminSectionProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<AdminPracticeTask[]>([])
  const [drafts, setDrafts] = useState<Record<number, PracticeTaskDraft>>({})
  const [newTaskDraft, setNewTaskDraft] =
    useState<PracticeTaskDraft>(emptyTaskDraft)
  const [isLoading, setIsLoading] = useState(false)
  const [actionIds, setActionIds] = useState<Set<string>>(() => new Set())
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? null,
    [modules, selectedModuleId],
  )
  const lessons = useMemo(
    () => sortLessons(selectedModule?.lessons ?? []),
    [selectedModule],
  )

  const loadTasks = useCallback(async (lessonId: number) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const practiceTasks = await getAdminLessonPracticeTasks(lessonId)

      setTasks(practiceTasks)
      setDrafts(
        practiceTasks.reduce<Record<number, PracticeTaskDraft>>(
          (accumulator, task) => {
            accumulator[task.id] = toTaskDraft(task)
            return accumulator
          },
          {},
        ),
      )
      setNewTaskDraft({
        ...emptyTaskDraft,
        orderNum: getNextOrderNumber(practiceTasks),
      })
    } catch (error) {
      setTasks([])
      setDrafts({})
      setErrorMessage(
        getAdminErrorMessage(
          error,
          'Не вдалося завантажити практичні завдання.',
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => {
      setSelectedModuleId(null)
      setSelectedLessonId(null)
      setTasks([])
      setDrafts({})
      setNewTaskDraft(emptyTaskDraft)
      setSuccessMessage(null)
      setErrorMessage(null)
    })
  }, [modules])

  useEffect(() => {
    if (!selectedLessonId) {
      return
    }

    void Promise.resolve().then(() => loadTasks(selectedLessonId))
  }, [loadTasks, selectedLessonId])

  function handleModuleChange(value: string) {
    setSelectedModuleId(parseSelectNumber(value))
    setSelectedLessonId(null)
    setTasks([])
    setDrafts({})
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  function handleLessonChange(value: string) {
    setSelectedLessonId(parseSelectNumber(value))
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  function updateNewTaskDraft(field: keyof PracticeTaskDraft, value: string | number | boolean) {
    setNewTaskDraft((draft) => ({
      ...draft,
      [field]: value,
    }))
    setErrorMessage(null)
  }

  function updateExistingDraft(
    taskId: number,
    field: keyof PracticeTaskDraft,
    value: string | number | boolean,
  ) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [taskId]: {
        ...(currentDrafts[taskId] ?? emptyTaskDraft),
        [field]: value,
      },
    }))
    setErrorMessage(null)
  }

  async function handleCreateTask() {
    if (!selectedLessonId) {
      setErrorMessage('Оберіть урок для практичного завдання.')
      return
    }

    const validationMessage = validateDraft(newTaskDraft)
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    setActionIds((ids) => new Set(ids).add('create'))
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      await createAdminLessonPracticeTask(selectedLessonId, {
        ...newTaskDraft,
        title: newTaskDraft.title.trim(),
        description: newTaskDraft.description.trim(),
      })
      await loadTasks(selectedLessonId)
      setSuccessMessage('Практичне завдання створено.')
    } catch (error) {
      setErrorMessage(
        getAdminErrorMessage(
          error,
          'Не вдалося створити практичне завдання.',
        ),
      )
    } finally {
      setActionIds((ids) => {
        const nextIds = new Set(ids)
        nextIds.delete('create')
        return nextIds
      })
    }
  }

  async function handleSaveTask(taskId: number) {
    if (!selectedLessonId) {
      return
    }

    const draft = drafts[taskId]
    const validationMessage = validateDraft(draft)
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    setActionIds((ids) => new Set(ids).add(`save-${taskId}`))
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      await updateAdminPracticeTask(taskId, {
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
      })
      await loadTasks(selectedLessonId)
      setSuccessMessage('Практичне завдання оновлено.')
    } catch (error) {
      setErrorMessage(
        getAdminErrorMessage(
          error,
          'Не вдалося оновити практичне завдання.',
        ),
      )
    } finally {
      setActionIds((ids) => {
        const nextIds = new Set(ids)
        nextIds.delete(`save-${taskId}`)
        return nextIds
      })
    }
  }

  async function handleToggleTask(task: AdminPracticeTask) {
    if (!selectedLessonId) {
      return
    }

    setActionIds((ids) => new Set(ids).add(`toggle-${task.id}`))
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      await updateAdminPracticeTask(task.id, {
        isActive: !task.isActive,
      })
      await loadTasks(selectedLessonId)
      setSuccessMessage(
        task.isActive
          ? 'Практичне завдання деактивовано.'
          : 'Практичне завдання активовано.',
      )
    } catch (error) {
      setErrorMessage(
        getAdminErrorMessage(
          error,
          'Не вдалося змінити статус практичного завдання.',
        ),
      )
    } finally {
      setActionIds((ids) => {
        const nextIds = new Set(ids)
        nextIds.delete(`toggle-${task.id}`)
        return nextIds
      })
    }
  }

  const isCreateBusy = actionIds.has('create')
  const isLessonSelectDisabled = isDisabled || !selectedModuleId

  return (
    <Card className="border border-slate-800 bg-slate-900 text-slate-100">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-300">Практика</p>
            <CardTitle className="text-xl text-slate-100">
              Практичні завдання уроку
            </CardTitle>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
            onClick={() => selectedLessonId && loadTasks(selectedLessonId)}
            disabled={!selectedLessonId || isLoading}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Оновити
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="practice-module" className="text-slate-200">
              Модуль
            </Label>
            <select
              id="practice-module"
              className={selectClass}
              value={selectedModuleId ?? ''}
              disabled={isDisabled || !hasModules}
              onChange={(event) => handleModuleChange(event.target.value)}
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
            <Label htmlFor="practice-lesson" className="text-slate-200">
              Урок
            </Label>
            <select
              id="practice-lesson"
              className={selectClass}
              value={selectedLessonId ?? ''}
              disabled={isLessonSelectDisabled || lessons.length === 0}
              onChange={(event) => handleLessonChange(event.target.value)}
            >
              <option value="">
                {lessons.length > 0 ? 'Оберіть урок' : 'Немає уроків'}
              </option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!selectedLessonId ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-sm text-slate-400">
            Оберіть урок, щоб керувати практичними завданнями.
          </div>
        ) : null}

        {selectedLessonId ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="practice-title" className="text-slate-200">
                  Назва
                </Label>
                <Input
                  id="practice-title"
                  className={controlClass}
                  value={newTaskDraft.title}
                  disabled={isCreateBusy}
                  onChange={(event) =>
                    updateNewTaskDraft('title', event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="practice-order" className="text-slate-200">
                  Порядок
                </Label>
                <Input
                  id="practice-order"
                  type="number"
                  min={1}
                  className={controlClass}
                  value={newTaskDraft.orderNum}
                  disabled={isCreateBusy}
                  onChange={(event) =>
                    updateNewTaskDraft(
                      'orderNum',
                      Number(event.target.value),
                    )
                  }
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="practice-description" className="text-slate-200">
                Опис завдання
              </Label>
              <textarea
                id="practice-description"
                className={`min-h-28 ${textareaBaseClass}`}
                value={newTaskDraft.description}
                disabled={isCreateBusy}
                onChange={(event) =>
                  updateNewTaskDraft('description', event.target.value)
                }
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="practice-starter" className="text-slate-200">
                  Стартовий код
                </Label>
                <textarea
                  id="practice-starter"
                  className={`min-h-40 font-mono ${textareaBaseClass}`}
                  value={newTaskDraft.starterCode}
                  disabled={isCreateBusy}
                  onChange={(event) =>
                    updateNewTaskDraft('starterCode', event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="practice-output" className="text-slate-200">
                  Очікуваний output
                </Label>
                <textarea
                  id="practice-output"
                  className={`min-h-40 font-mono ${textareaBaseClass}`}
                  value={newTaskDraft.expectedOutput}
                  disabled={isCreateBusy}
                  onChange={(event) =>
                    updateNewTaskDraft('expectedOutput', event.target.value)
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
                  checked={newTaskDraft.isActive}
                  disabled={isCreateBusy}
                  onChange={(event) =>
                    updateNewTaskDraft('isActive', event.target.checked)
                  }
                />
                Активне
              </label>

              <Button
                type="button"
                className="bg-sky-500 text-slate-950 hover:bg-sky-400"
                disabled={isCreateBusy}
                onClick={handleCreateTask}
              >
                {isCreateBusy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                Створити завдання
              </Button>
            </div>
          </div>
        ) : null}

        {successMessage ? (
          <p className="text-sm text-emerald-300">{successMessage}</p>
        ) : null}
        {errorMessage ? (
          <p className="text-sm text-rose-300" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full bg-slate-800" />
            <Skeleton className="h-24 w-full bg-slate-800" />
          </div>
        ) : null}

        {!isLoading && selectedLessonId && tasks.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-sm text-slate-400">
            Практичні завдання для цього уроку ще не створені.
          </div>
        ) : null}

        {!isLoading && tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task) => {
              const draft = drafts[task.id] ?? toTaskDraft(task)
              const isSaving = actionIds.has(`save-${task.id}`)
              const isToggling = actionIds.has(`toggle-${task.id}`)

              return (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        #{task.orderNum} ·{' '}
                        {task.isActive ? 'Активне' : 'Неактивне'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
                        disabled={isSaving}
                        onClick={() => handleSaveTask(task.id)}
                      >
                        {isSaving ? (
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Pencil className="size-4" aria-hidden="true" />
                        )}
                        Зберегти
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
                        disabled={isToggling}
                        onClick={() => handleToggleTask(task)}
                      >
                        {isToggling ? (
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : null}
                        {task.isActive ? 'Деактивувати' : 'Активувати'}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_7rem]">
                    <div className="space-y-2">
                      <Label
                        htmlFor={`practice-task-title-${task.id}`}
                        className="text-slate-200"
                      >
                        Назва
                      </Label>
                      <Input
                        id={`practice-task-title-${task.id}`}
                        className={controlClass}
                        value={draft.title}
                        disabled={isSaving || isToggling}
                        onChange={(event) =>
                          updateExistingDraft(
                            task.id,
                            'title',
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`practice-task-order-${task.id}`}
                        className="text-slate-200"
                      >
                        Порядок
                      </Label>
                      <Input
                        id={`practice-task-order-${task.id}`}
                        type="number"
                        min={1}
                        className={controlClass}
                        value={draft.orderNum}
                        disabled={isSaving || isToggling}
                        onChange={(event) =>
                          updateExistingDraft(
                            task.id,
                            'orderNum',
                            Number(event.target.value),
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label
                      htmlFor={`practice-task-description-${task.id}`}
                      className="text-slate-200"
                    >
                      Опис завдання
                    </Label>
                    <textarea
                      id={`practice-task-description-${task.id}`}
                      className={`min-h-28 ${textareaBaseClass}`}
                      value={draft.description}
                      disabled={isSaving || isToggling}
                      onChange={(event) =>
                        updateExistingDraft(
                          task.id,
                          'description',
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor={`practice-task-starter-${task.id}`}
                        className="text-slate-200"
                      >
                        Стартовий код
                      </Label>
                      <textarea
                        id={`practice-task-starter-${task.id}`}
                        className={`min-h-36 font-mono ${textareaBaseClass}`}
                        value={draft.starterCode}
                        disabled={isSaving || isToggling}
                        onChange={(event) =>
                          updateExistingDraft(
                            task.id,
                            'starterCode',
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`practice-task-output-${task.id}`}
                        className="text-slate-200"
                      >
                        Очікуваний output
                      </Label>
                      <textarea
                        id={`practice-task-output-${task.id}`}
                        className={`min-h-36 font-mono ${textareaBaseClass}`}
                        value={draft.expectedOutput}
                        disabled={isSaving || isToggling}
                        onChange={(event) =>
                          updateExistingDraft(
                            task.id,
                            'expectedOutput',
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
