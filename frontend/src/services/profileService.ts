import { apiClient } from '@/services/apiClient'
import type {
  Course,
  MessageResponse,
  ProfileResponse,
  UpdateProfileRequest,
} from '@/types/api'

export async function getProfile(): Promise<ProfileResponse> {
  const { data } = await apiClient.get<ProfileResponse>('/api/profile')

  return data
}

export async function updateProfile(
  payload: UpdateProfileRequest,
): Promise<MessageResponse> {
  const { data } = await apiClient.put<MessageResponse>('/api/profile', payload)

  return data
}

export async function getProfileCourses(): Promise<Course[]> {
  const { data } = await apiClient.get<Course[]>('/api/profile/courses')

  return data
}
