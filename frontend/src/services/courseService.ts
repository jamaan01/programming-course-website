import { apiClient } from '@/services/apiClient'
import type {
  Course,
  CourseAccessResponse,
  CourseProgressResponse,
  MessageResponse,
} from '@/types/api'

export async function getCourses(): Promise<Course[]> {
  const { data } = await apiClient.get<Course[]>('/api/courses')

  return data
}

export async function getCourseById(courseId: number): Promise<Course> {
  const { data } = await apiClient.get<Course>(`/api/courses/${courseId}`)

  return data
}

export async function getCourseSyllabus(courseId: number): Promise<Course> {
  const { data } = await apiClient.get<Course>(
    `/api/courses/${courseId}/syllabus`,
  )

  return data
}

export async function enrollInCourse(
  courseId: number,
): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>(
    `/api/courses/${courseId}/enroll`,
  )

  return data
}

export async function getCourseProgress(
  courseId: number,
): Promise<CourseProgressResponse> {
  const { data } = await apiClient.get<CourseProgressResponse>(
    `/api/courses/${courseId}/progress`,
  )

  return data
}

export async function getCourseAccess(
  courseId: number,
): Promise<CourseAccessResponse> {
  const { data } = await apiClient.get<CourseAccessResponse>(
    `/api/courses/${courseId}/access`,
  )

  return data
}
