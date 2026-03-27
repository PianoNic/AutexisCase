import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/auth/auth-provider'
import { ProtectedRoute } from '@/auth/protected-route'
import { LoginPage } from '@/pages/login'
import { CallbackPage } from '@/pages/callback'
import HomeScreen from './screens/HomeScreen'
import ScanScreen from './screens/ScanScreen'
import LotCaptureScreen from './screens/LotCaptureScreen'
import ProductScreen from './screens/ProductScreen'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/callback" element={<CallbackPage />} />
            <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
            <Route path="/scan" element={<ProtectedRoute><ScanScreen /></ProtectedRoute>} />
            <Route path="/scan/lot" element={<ProtectedRoute><LotCaptureScreen /></ProtectedRoute>} />
            <Route path="/product" element={<ProtectedRoute><ProductScreen /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
