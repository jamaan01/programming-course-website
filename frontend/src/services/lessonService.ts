import { apiClient } from '@/services/apiClient'
import type {
  CompleteLessonRequest,
  CompleteLessonResponse,
  Lesson,
} from '@/types/api'

export async function getLessonById(lessonId: number): Promise<Lesson> {
  const { data } = await apiClient.get<Lesson>(`/api/lessons/${lessonId}`)

  return data
}

export async function completeLesson(
  lessonId: number,
  payload: CompleteLessonRequest,
): Promise<CompleteLessonResponse> {
  const { data } = await apiClient.post<CompleteLessonResponse>(
    `/api/lessons/${lessonId}/complete`,
    payload,
  )

  return data
}
