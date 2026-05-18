import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { CoursePage } from '@/pages/CoursePage'
import { HomePage } from '@/pages/HomePage'
import { LessonPage } from '@/pages/LessonPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RegisterPage } from '@/pages/RegisterPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/courses/:courseId',
        element: <CoursePage />,
      },
      {
        path: '/courses/:courseId/lessons/:lessonId',
        element: (
          <ProtectedRoute>
            <LessonPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },
])
