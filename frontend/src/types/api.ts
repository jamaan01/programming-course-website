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

export interface LessonQuestionOption {
  id: number
  question_id: number
  option_text: string
  order_num: number
}

export interface LessonQuestionUserAnswer {
  selected_option_id: number
  is_correct: boolean
}

export interface LessonQuestion {
  id: number
  lesson_id: number
  question_text: string
  order_num: number
  options: LessonQuestionOption[]
  user_answer: LessonQuestionUserAnswer | null
}

export interface LessonQuestionsResponse {
  questions: LessonQuestion[]
  all_questions_correct: boolean
}

export interface SubmitAnswerRequest {
  option_id: number
}

export interface SubmitAnswerResponse {
  question_id: number
  selected_option_id: number
  is_correct: boolean
  all_questions_correct: boolean
}

export interface CourseProgressResponse {
  completed_lesson_ids: number[]
}

export interface CreateCourseRequest {
  title: string
  description: string
}

export interface CreateCourseResponse {
  message: string
  course_id: number
}

export interface CreateModuleRequest {
  title: string
  order_num: number
}

export interface CreateModuleResponse {
  message: string
  module_id: number
}

export interface CreateLessonRequest {
  title: string
  content: string
  order_num: number
}

export interface CreateLessonResponse {
  message: string
  lesson_id: number
}

export interface UpdateCoursePublishRequest {
  is_published: boolean
}

export interface UpdateCoursePublishResponse {
  message: string
  is_published: boolean
}

export interface AdminQuestion {
  id: number
  lesson_id: number
  question_text: string
  order_num: number
  options: AdminQuestionOption[]
}

export interface AdminQuestionOption {
  id: number
  question_id: number
  option_text: string
  is_correct: boolean
  order_num: number
}

export interface CreateQuestionRequest {
  question_text: string
  order_num: number
  options: CreateQuestionOptionRequest[]
}

export interface CreateQuestionOptionRequest {
  option_text: string
  is_correct: boolean
  order_num: number
}

export interface CreateQuestionResponse {
  message: string
  question_id: number
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
