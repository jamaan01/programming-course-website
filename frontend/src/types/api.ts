export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface RegisterResponse {
  id: number
  name: string
  email: string
  role: string
  jwt?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  JWT: string
}

export interface UpdateProfileRequest {
  name: string
  email: string
}

export interface ProfileResponse {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}

export interface Course {
  id: number
  title: string
  description: string
  is_published: boolean
  modules?: CourseModule[]
}

export interface CourseModule {
  id: number
  course_id: number
  title: string
  order_num: number
  lessons?: CourseLesson[]
}

export interface CourseLesson {
  id: number
  module_id: number
  title: string
  content?: string
  order_num: number
}

export interface Lesson {
  id: number
  module_id: number
  title: string
  content: string
  order_num: number
}

export interface CourseProgressResponse {
  completed_lesson_ids: number[]
}

export interface CompleteLessonRequest {
  completed: boolean
}

export interface CompleteLessonResponse {
  message: string
  is_completed: boolean
}

export interface MessageResponse {
  message: string
}

export interface ApiErrorResponse {
  error?: string
  details?: string
}

export interface NormalizedApiError {
  status?: number
  message: string
  backendMessage?: string
  details?: string
}
