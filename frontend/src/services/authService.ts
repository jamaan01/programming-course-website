import { apiClient, setStoredAuthToken } from '@/services/apiClient'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/types/api'

export async function registerUser(
  payload: RegisterRequest,
): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>(
    '/auth/register',
    payload,
  )

  if (data.jwt) {
    setStoredAuthToken(data.jwt)
  }

  return data
}

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)

  if (data.JWT) {
    setStoredAuthToken(data.JWT)
  }

  return data
}
