import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/auth/auth-provider'
import { ProtectedRoute } from '@/auth/protected-route'
import { LoginPage } from '@/pages/login'
import { CallbackPage } from '@/pages/callback'
import { HomePage } from '@/pages/home'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
