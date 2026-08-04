import { apiClient } from '@/services/apiClient'
import type {
  AdminCourseAccess,
  AdminCreateQuestionOptionPayload,
  AdminUpdateCorrectOptionPayload,
  AdminUpdateCoursePayload,
  AdminUpdateLessonPayload,
  AdminUpdateModulePayload,
  AdminUpdateQuestionOptionPayload,
  AdminUpdateQuestionPayload,
  AdminQuestion,
  AdminQuestionOption,
  AdminPracticeTask,
  AdminUser,
  Course,
  CreatePracticeTaskPayload,
  CreateCourseRequest,
  CreateCourseResponse,
  CreateLessonRequest,
  CreateLessonResponse,
  CreateModuleRequest,
  CreateModuleResponse,
  CreateQuestionRequest,
  CreateQuestionResponse,
  GrantCourseAccessRequest,
  MessageResponse,
  UpdatePracticeTaskPayload,
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

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data } = await apiClient.get<AdminUser[]>('/api/admin/users')

  return data
}

export async function getAdminCourseAccess(): Promise<AdminCourseAccess[]> {
  const { data } = await apiClient.get<AdminCourseAccess[]>(
    '/api/admin/course-access',
  )

  return data
}

export async function grantAdminCourseAccess(
  payload: GrantCourseAccessRequest,
): Promise<AdminCourseAccess> {
  const { data } = await apiClient.post<AdminCourseAccess>(
    '/api/admin/course-access',
    payload,
  )

  return data
}

export async function revokeAdminCourseAccess(
  accessId: number,
): Promise<MessageResponse> {
  const { data } = await apiClient.patch<MessageResponse>(
    `/api/admin/course-access/${accessId}/revoke`,
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

export async function updateAdminCourse(
  courseId: number,
  payload: AdminUpdateCoursePayload,
): Promise<MessageResponse> {
  const { data } = await apiClient.patch<MessageResponse>(
    `/api/admin/courses/${courseId}`,
    payload,
  )

  return data
}

export async function updateAdminModule(
  moduleId: number,
  payload: AdminUpdateModulePayload,
): Promise<MessageResponse> {
  const { data } = await apiClient.patch<MessageResponse>(
    `/api/admin/modules/${moduleId}`,
    payload,
  )

  return data
}

export async function updateAdminLesson(
  lessonId: number,
  payload: AdminUpdateLessonPayload,
): Promise<MessageResponse> {
  const { data } = await apiClient.patch<MessageResponse>(
    `/api/admin/lessons/${lessonId}`,
    payload,
  )

  return data
}

export async function updateAdminQuestion(
  questionId: number,
  payload: AdminUpdateQuestionPayload,
): Promise<MessageResponse> {
  const { data } = await apiClient.patch<MessageResponse>(
    `/api/admin/questions/${questionId}`,
    payload,
  )

  return data
}

export async function updateAdminQuestionOption(
  optionId: number,
  payload: AdminUpdateQuestionOptionPayload,
): Promise<MessageResponse> {
  const { data } = await apiClient.patch<MessageResponse>(
    `/api/admin/question-options/${optionId}`,
    payload,
  )

  return data
}

export async function createAdminQuestionOption(
  questionId: number,
  payload: AdminCreateQuestionOptionPayload,
): Promise<AdminQuestionOption> {
  const { data } = await apiClient.post<AdminQuestionOption>(
    `/api/admin/questions/${questionId}/options`,
    payload,
  )

  return data
}

export async function deleteAdminQuestionOption(
  optionId: number,
): Promise<MessageResponse> {
  const { data } = await apiClient.delete<MessageResponse>(
    `/api/admin/question-options/${optionId}`,
  )

  return data
}

export async function updateAdminQuestionCorrectOption(
  questionId: number,
  payload: AdminUpdateCorrectOptionPayload,
): Promise<MessageResponse> {
  const { data } = await apiClient.patch<MessageResponse>(
    `/api/admin/questions/${questionId}/correct-option`,
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

export async function getAdminLessonPracticeTasks(
  lessonId: number,
): Promise<AdminPracticeTask[]> {
  const { data } = await apiClient.get<AdminPracticeTask[]>(
    `/api/admin/lessons/${lessonId}/practice-tasks`,
  )

  return data
}

export async function createAdminLessonPracticeTask(
  lessonId: number,
  payload: CreatePracticeTaskPayload,
): Promise<AdminPracticeTask> {
  const { data } = await apiClient.post<AdminPracticeTask>(
    `/api/admin/lessons/${lessonId}/practice-tasks`,
    payload,
  )

  return data
}

export async function updateAdminPracticeTask(
  taskId: number,
  payload: UpdatePracticeTaskPayload,
): Promise<AdminPracticeTask> {
  const { data } = await apiClient.patch<AdminPracticeTask>(
    `/api/admin/practice-tasks/${taskId}`,
    payload,
  )

  return data
}
