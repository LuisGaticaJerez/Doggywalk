import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Pets from './pages/Pets'
import PetForm from './pages/PetForm'
import SearchServices from './pages/SearchServices'
import BookingForm from './pages/BookingForm'
import Bookings from './pages/Bookings'
import LiveTracking from './pages/LiveTracking'
import ActiveWalk from './pages/ActiveWalk'
import ProviderProfile from './pages/ProviderProfile'
import Settings from './pages/Settings'
import { Chat } from './pages/Chat'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { I18nProvider } from './contexts/I18nContext'
import { ToastProvider } from './contexts/ToastContext'

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <ToastProvider>
          <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/pets" element={
            <ProtectedRoute requireRole="owner">
              <Pets />
            </ProtectedRoute>
          } />

          <Route path="/pets/new" element={
            <ProtectedRoute requireRole="owner">
              <PetForm />
            </ProtectedRoute>
          } />

          <Route path="/pets/:id/edit" element={
            <ProtectedRoute requireRole="owner">
              <PetForm />
            </ProtectedRoute>
          } />

          <Route path="/search" element={
            <ProtectedRoute requireRole="owner">
              <SearchServices />
            </ProtectedRoute>
          } />

          <Route path="/provider/:providerId/book" element={
            <ProtectedRoute requireRole="owner">
              <BookingForm />
            </ProtectedRoute>
          } />

          <Route path="/bookings" element={
            <ProtectedRoute requireRole="owner">
              <Bookings />
            </ProtectedRoute>
          } />

          <Route path="/bookings/:bookingId/track" element={
            <ProtectedRoute requireRole="owner">
              <LiveTracking />
            </ProtectedRoute>
          } />

          <Route path="/bookings/:bookingId/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />

          <Route path="/my-bookings" element={
            <ProtectedRoute requireRole="pet_master">
              <Bookings />
            </ProtectedRoute>
          } />

          <Route path="/my-bookings/:bookingId/walk" element={
            <ProtectedRoute requireRole="pet_master">
              <ActiveWalk />
            </ProtectedRoute>
          } />

          <Route path="/profile-setup" element={
            <ProtectedRoute requireRole="pet_master">
              <ProviderProfile />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
        </Routes>
          </Router>
        </ToastProvider>
      </I18nProvider>
    </AuthProvider>
  )
}

export default App
