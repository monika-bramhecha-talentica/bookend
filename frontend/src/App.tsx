import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import BookCatalogPage from './components/books/BookCatalogPage'
import BookDetailsPage from './components/books/BookDetailsPage'
import ProfilePage from './components/profile/ProfilePage'
import DashboardPage from './components/dashboard/DashboardPage'
import { useAppSelector } from './store/hooks'
import './App.css'

function App() {
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      <Route path="/signup" element={<Navigate to="/register" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/books"
        element={
          <ProtectedRoute>
            <BookCatalogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/books/:id"
        element={
          <ProtectedRoute>
            <BookDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
