import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingFallback from './components/LoadingFallback'
import { AuthProvider } from './contexts/AuthContext'
import { I18nProvider } from './contexts/I18nContext'
import { ToastProvider } from './contexts/ToastContext'
import { NotificationProvider } from './contexts/NotificationContext'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Pets = lazy(() => import('./pages/Pets'))
const PetForm = lazy(() => import('./pages/PetForm'))
const SearchServices = lazy(() => import('./pages/SearchServices'))
const BookingForm = lazy(() => import('./pages/BookingForm'))
const Bookings = lazy(() => import('./pages/Bookings'))
const LiveTracking = lazy(() => import('./pages/LiveTracking'))
const ActiveWalk = lazy(() => import('./pages/ActiveWalk'))
const ProviderProfile = lazy(() => import('./pages/ProviderProfile'))
const Settings = lazy(() => import('./pages/Settings'))
const RateBooking = lazy(() => import('./pages/RateBooking'))
const Chat = lazy(() => import('./pages/Chat').then(module => ({ default: module.Chat })))
const ProviderOnboarding = lazy(() => import('./pages/ProviderOnboarding'))
const ManageServices = lazy(() => import('./pages/ManageServices'))
const ManageOfferings = lazy(() => import('./pages/ManageOfferings'))
const IdentityVerificationPage = lazy(() => import('./pages/IdentityVerificationPage'))
const Support = lazy(() => import('./pages/Support'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const RecurringSeries = lazy(() => import('./pages/RecurringSeries'))

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <ToastProvider>
          <NotificationProvider>
            <Router>
              <Suspense fallback={<LoadingFallback />}>
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

          <Route path="/search" element={<SearchServices />} />

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

          <Route path="/bookings/:bookingId/rate" element={
            <ProtectedRoute requireRole="owner">
              <RateBooking />
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

          <Route path="/provider-onboarding" element={
            <ProtectedRoute requireRole="pet_master">
              <ProviderOnboarding />
            </ProtectedRoute>
          } />

          <Route path="/identity-verification" element={
            <ProtectedRoute requireRole="pet_master">
              <IdentityVerificationPage />
            </ProtectedRoute>
          } />

          <Route path="/manage-services" element={
            <ProtectedRoute requireRole="pet_master">
              <ManageServices />
            </ProtectedRoute>
          } />

          <Route path="/manage-offerings" element={
            <ProtectedRoute requireRole="pet_master">
              <ManageOfferings />
            </ProtectedRoute>
          } />

          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />

          <Route path="/support" element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/recurring-bookings" element={
            <ProtectedRoute requireRole="owner">
              <RecurringSeries />
            </ProtectedRoute>
          } />
                </Routes>
              </Suspense>
            </Router>
          </NotificationProvider>
        </ToastProvider>
      </I18nProvider>
    </AuthProvider>
  )
}

export default App
