import { apiClient } from '@/services/apiClient'
import type {
  LessonPracticeResponse,
  PracticeCheckRequest,
  PracticeCheckResponse,
  PracticeSummary,
} from '@/types/api'

export async function getLessonPracticeSummary(
  lessonId: number,
): Promise<PracticeSummary> {
  const { data } = await apiClient.get<PracticeSummary>(
    `/api/lessons/${lessonId}/practice/summary`,
  )

  return data
}

export async function getLessonPractice(
  lessonId: number,
): Promise<LessonPracticeResponse> {
  const { data } = await apiClient.get<LessonPracticeResponse>(
    `/api/lessons/${lessonId}/practice`,
  )

  return data
}

export async function checkPracticeTask(
  taskId: number,
  output: string,
): Promise<PracticeCheckResponse> {
  const payload: PracticeCheckRequest = { output }
  const { data } = await apiClient.post<PracticeCheckResponse>(
    `/api/practice-tasks/${taskId}/check`,
    payload,
  )

  return data
}
