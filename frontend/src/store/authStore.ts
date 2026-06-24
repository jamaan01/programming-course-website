import { create } from 'zustand'

import {
  AUTH_TOKEN_STORAGE_KEY,
  clearStoredAuthToken,
  getStoredAuthToken,
  isUnauthorizedStatus,
  normalizeApiError,
  setStoredAuthToken,
} from '@/services/apiClient'
import { loginUser, registerUser } from '@/services/authService'
import { getProfile } from '@/services/profileService'
import type {
  LoginRequest,
  NormalizedApiError,
  ProfileResponse,
  RegisterRequest,
} from '@/types/api'

export const AUTH_STORE_TOKEN_STORAGE_KEY = AUTH_TOKEN_STORAGE_KEY

type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated'

interface AuthStoreState {
  token: string | null
  user: ProfileResponse | null
  authStatus: AuthStatus
  isLoading: boolean
  error: NormalizedApiError | null
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
  loadProfile: () => Promise<void>
  init: () => Promise<void>
  checkAuth: () => Promise<void>
  clearAuth: () => void
  clearError: () => void
}

const defaultAuthError: NormalizedApiError = {
  status: 401,
  message: 'Увійдіть в акаунт',
}

const fallbackError: NormalizedApiError = {
  message: 'Спробуйте ще раз',
}

function isNormalizedApiError(error: unknown): error is NormalizedApiError {
  if (!error || typeof error !== 'object') {
    return false
  }

  return (
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  )
}

function toNormalizedApiError(error: unknown): NormalizedApiError {
  if (isNormalizedApiError(error)) {
    return error
  }

  const normalizedError = normalizeApiError(error)

  return normalizedError.message ? normalizedError : fallbackError
}

function getMissingTokenError(): NormalizedApiError {
  return {
    ...defaultAuthError,
    message: 'Не вдалося підтвердити авторизацію',
  }
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  token: null,
  user: null,
  authStatus: 'idle',
  isLoading: false,
  error: null,

  async login(payload) {
    set({ isLoading: true, error: null })

    let storedLoginToken = false

    try {
      const response = await loginUser(payload)

      if (!response.JWT) {
        throw getMissingTokenError()
      }

      setStoredAuthToken(response.JWT)
      storedLoginToken = true
      const profile = await getProfile()

      set({
        token: response.JWT,
        user: profile,
        authStatus: 'authenticated',
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const normalizedError = toNormalizedApiError(error)

      if (storedLoginToken && isUnauthorizedStatus(normalizedError.status)) {
        get().clearAuth()
      }

      set({
        isLoading: false,
        error: normalizedError,
      })
    }
  },

  async register(payload) {
    set({ isLoading: true, error: null })

    let storedRegisterToken = false

    try {
      const response = await registerUser(payload)

      if (!response.jwt) {
        throw getMissingTokenError()
      }

      setStoredAuthToken(response.jwt)
      storedRegisterToken = true
      const profile = await getProfile()

      set({
        token: response.jwt,
        user: profile,
        authStatus: 'authenticated',
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const normalizedError = toNormalizedApiError(error)

      if (storedRegisterToken && isUnauthorizedStatus(normalizedError.status)) {
        get().clearAuth()
      }

      set({
        isLoading: false,
        error: normalizedError,
      })
    }
  },

  logout() {
    get().clearAuth()
  },

  async loadProfile() {
    set({ isLoading: true, error: null })

    try {
      const profile = await getProfile()
      const token = getStoredAuthToken()

      set({
        token,
        user: profile,
        authStatus: 'authenticated',
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const normalizedError = toNormalizedApiError(error)

      if (isUnauthorizedStatus(normalizedError.status)) {
        get().clearAuth()
      }

      set({
        isLoading: false,
        error: normalizedError,
      })
    }
  },

  async init() {
    set({ isLoading: true, error: null })

    const token = getStoredAuthToken()

    if (!token) {
      set({
        token: null,
        user: null,
        authStatus: 'unauthenticated',
        isLoading: false,
        error: null,
      })
      return
    }

    set({ token })

    try {
      const profile = await getProfile()

      set({
        token,
        user: profile,
        authStatus: 'authenticated',
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const normalizedError = toNormalizedApiError(error)

      if (isUnauthorizedStatus(normalizedError.status)) {
        get().clearAuth()
      } else {
        // Preserve the token through deploy restarts, offline mode and 5xx errors.
        set({
          token,
          user: null,
          authStatus: 'authenticated',
          isLoading: false,
        })
      }

      set({
        isLoading: false,
        error: normalizedError,
      })
    }
  },

  async checkAuth() {
    await get().init()
  },

  clearAuth() {
    clearStoredAuthToken()

    set({
      token: null,
      user: null,
      authStatus: 'unauthenticated',
      isLoading: false,
    })
  },

  clearError() {
    set({ error: null })
  },
}))
