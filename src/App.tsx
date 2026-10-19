import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { LoginPage } from '@/pages/LoginPage'
import { MainPage } from '@/pages/MainPage'
import { SignupPage } from '@/pages/SignupPage'
import { GuestOnly, RequireAuth } from '@/routes/guards'

const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [{ path: '/', element: <MainPage /> }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
