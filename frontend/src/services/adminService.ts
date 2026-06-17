import { apiClient } from '@/services/apiClient'
import type {
  AdminQuestion,
  Course,
  CreateCourseRequest,
  CreateCourseResponse,
  CreateLessonRequest,
  CreateLessonResponse,
  CreateModuleRequest,
  CreateModuleResponse,
  CreateQuestionRequest,
  CreateQuestionResponse,
  UpdateCoursePublishRequest,
  UpdateCoursePublishResponse,
} from '@/types/api'

export async function getAdminCourses(): Promise<Course[]> {
  const { data } = await apiClient.get<Course[]>('/api/admin/courses')

  return data
}

export async function getAdminCourse(courseId: number): Promise<Course> {
  const { data } = await apiClient.get<Course>(`/api/admin/courses/${courseId}`)

  return data
}

export async function getAdminCourseSyllabus(
  courseId: number,
): Promise<Course> {
  const { data } = await apiClient.get<Course>(
    `/api/admin/courses/${courseId}/syllabus`,
  )

  return data
}

export async function createAdminCourse(
  payload: CreateCourseRequest,
): Promise<CreateCourseResponse> {
  const { data } = await apiClient.post<CreateCourseResponse>(
    '/api/admin/courses',
    payload,
  )

  return data
}

export async function createAdminModule(
  courseId: number,
  payload: CreateModuleRequest,
): Promise<CreateModuleResponse> {
  const { data } = await apiClient.post<CreateModuleResponse>(
    `/api/admin/courses/${courseId}/modules`,
    payload,
  )

  return data
}

export async function createAdminLesson(
  moduleId: number,
  payload: CreateLessonRequest,
): Promise<CreateLessonResponse> {
  const { data } = await apiClient.post<CreateLessonResponse>(
    `/api/admin/modules/${moduleId}/lessons`,
    payload,
  )

  return data
}

export async function updateAdminCoursePublishStatus(
  courseId: number,
  isPublished: boolean,
): Promise<UpdateCoursePublishResponse> {
  const payload: UpdateCoursePublishRequest = {
    is_published: isPublished,
  }

  const { data } = await apiClient.patch<UpdateCoursePublishResponse>(
    `/api/admin/courses/${courseId}/publish`,
    payload,
  )

  return data
}

export async function createAdminLessonQuestion(
  lessonId: number,
  payload: CreateQuestionRequest,
): Promise<CreateQuestionResponse> {
  const { data } = await apiClient.post<CreateQuestionResponse>(
    `/api/admin/lessons/${lessonId}/questions`,
    payload,
  )

  return data
}

export async function getAdminLessonQuestions(
  lessonId: number,
): Promise<AdminQuestion[]> {
  const { data } = await apiClient.get<AdminQuestion[]>(
    `/api/admin/lessons/${lessonId}/questions`,
  )

  return data
}
