import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { ClientDetailPage } from './pages/ClientDetailPage/ClientDetailPage'
import { ClientsPage } from './pages/ClientsPage/ClientsPage'
import { LoginPage, ResetPasswordPage } from './pages/LoginPage/LoginPage'
import { MembersPage } from './pages/MembersPage/MembersPage'

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/clients" replace />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:clientId" element={<ClientDetailPage />} />
        <Route
          path="members"
          element={
            <ProtectedRoute roles={['admin']}>
              <MembersPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/clients" replace />} />
    </Routes>
  )
}
