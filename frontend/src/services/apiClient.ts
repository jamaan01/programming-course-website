import axios from 'axios'
import type { AxiosError } from 'axios'

import type { ApiErrorResponse, NormalizedApiError } from '@/types/api'

export const AUTH_TOKEN_STORAGE_KEY = 'auth_token'

const DEFAULT_API_BASE_URL = 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

export function setStoredAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

export function clearStoredAuthToken(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

export function getUserFriendlyErrorMessage(status?: number): string {
  switch (status) {
    case 400:
      return 'Некоректні дані'
    case 401:
      return 'Увійдіть в акаунт'
    case 403:
      return 'Немає доступу'
    case 404:
      return 'Не знайдено'
    case 409:
      return 'Конфлікт даних'
    case 500:
      return 'Помилка сервера'
    default:
      return 'Спробуйте ще раз'
  }
}

export function isUnauthorizedStatus(status?: number): boolean {
  return status === 401 || status === 403
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return {
      message: 'Спробуйте ще раз',
    }
  }

  const axiosError = error as AxiosError<ApiErrorResponse>
  const status = axiosError.response?.status
  const data = axiosError.response?.data

  return {
    status,
    message: getUserFriendlyErrorMessage(status),
    backendMessage: data?.error,
    details: data?.details,
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalizedError = normalizeApiError(error)

    // Keep token persistence out of the generic API layer: network errors,
    // deploy restarts and 5xx responses must not accidentally log users out.

    return Promise.reject(normalizedError)
  },
)
