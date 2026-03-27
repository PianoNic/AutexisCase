import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomeScreen from './screens/HomeScreen'
import ScanScreen from './screens/ScanScreen'
import ProductScreen from './screens/ProductScreen'

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/scan" element={<ScanScreen />} />
          <Route path="/product" element={<ProductScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
