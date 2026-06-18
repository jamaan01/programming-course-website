import { apiClient } from '@/services/apiClient'
import type {
  LessonQuestionsResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from '@/types/api'

export async function getLessonQuestions(
  lessonId: number,
): Promise<LessonQuestionsResponse> {
  const { data } = await apiClient.get<LessonQuestionsResponse>(
    `/api/lessons/${lessonId}/questions`,
  )

  return data
}

export async function submitQuestionAnswer(
  questionId: number,
  payload: SubmitAnswerRequest,
): Promise<SubmitAnswerResponse> {
  const { data } = await apiClient.post<SubmitAnswerResponse>(
    `/api/questions/${questionId}/answer`,
    payload,
  )

  return data
}
