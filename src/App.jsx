import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ClientDashboard from './pages/ClientDashboard'
import TrainerDashboard from './pages/TrainerDashboard'
import SearchPage from './pages/SearchPage'
import TrainerProfilePage from './pages/TrainerProfilePage'
import BookingPage from './pages/BookingPage'
import MessagesPage from './pages/MessagesPage'
import ConversationPage from './pages/ConversationPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import TrainerOnboardingPage from './pages/TrainerOnboardingPage'
import TrainerProfileEditPage from './pages/TrainerProfileEditPage'
import TrainerListingsPage from './pages/TrainerListingsPage'
import TrainerListingFormPage from './pages/TrainerListingFormPage'
import TrainerAvailabilityPage from './pages/TrainerAvailabilityPage'
import TrainerCalendarPage from './pages/TrainerCalendarPage'
import TrainerIncomePage from './pages/TrainerIncomePage'
import { initCapacitor } from './lib/capacitor'
import { IS_TRAINER } from './lib/theme'

function ProtectedRoute({ children, roles = [] }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles.length > 0 && profile) {
    const allowed = roles.flatMap(r => r === 'trainer' ? ['trainer_individual', 'trainer_business'] : [r])
    if (!allowed.includes(profile.role)) {
      return <Navigate to={profile.role === 'client' ? '/dashboard' : '/trainer'} replace />
    }
  }

  return children
}

function RoleBasedDashboard() {
  const { profile } = useAuth()

  if (!profile) return null

  return profile.role === 'client'
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/trainer" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<LoginPage mode="reset" />} />

      <Route path="/dashboard" element={
        <ProtectedRoute roles={['client']}>
          <ClientDashboard />
        </ProtectedRoute>
      } />

      <Route path="/trainer" element={
        <ProtectedRoute roles={['trainer']}>
          <TrainerDashboard />
        </ProtectedRoute>
      } />

      <Route path="/home" element={
        <ProtectedRoute>
          <RoleBasedDashboard />
        </ProtectedRoute>
      } />

      <Route path="/search" element={
        <ProtectedRoute roles={['client']}>
          <SearchPage />
        </ProtectedRoute>
      } />

      <Route path="/book/:trainerId/:listingId?" element={
        <ProtectedRoute roles={['client']}>
          <BookingPage />
        </ProtectedRoute>
      } />

      <Route path="/messages" element={
        <ProtectedRoute>
          <MessagesPage />
        </ProtectedRoute>
      } />

      <Route path="/messages/:conversationId" element={
        <ProtectedRoute>
          <ConversationPage />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />

      <Route path="/trainer/onboarding" element={
        <ProtectedRoute roles={['trainer']}>
          <TrainerOnboardingPage />
        </ProtectedRoute>
      } />

      <Route path="/trainer/profile/edit" element={
        <ProtectedRoute roles={['trainer']}>
          <TrainerProfileEditPage />
        </ProtectedRoute>
      } />

      <Route path="/trainer/listings/new" element={
        <ProtectedRoute roles={['trainer']}>
          <TrainerListingFormPage />
        </ProtectedRoute>
      } />

      <Route path="/trainer/listings/:id" element={
        <ProtectedRoute roles={['trainer']}>
          <TrainerListingFormPage />
        </ProtectedRoute>
      } />

      <Route path="/trainer/listings" element={
        <ProtectedRoute roles={['trainer']}>
          <TrainerListingsPage />
        </ProtectedRoute>
      } />

      <Route path="/trainer/availability" element={
        <ProtectedRoute roles={['trainer']}>
          <TrainerAvailabilityPage />
        </ProtectedRoute>
      } />

      <Route path="/trainer/calendar" element={
        <ProtectedRoute roles={['trainer']}>
          <TrainerCalendarPage />
        </ProtectedRoute>
      } />

      <Route path="/trainer/income" element={
        <ProtectedRoute roles={['trainer']}>
          <TrainerIncomePage />
        </ProtectedRoute>
      } />

      <Route path="/trainer/:id" element={
        <ProtectedRoute>
          <TrainerProfilePage />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  useEffect(() => {
    initCapacitor()
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors">
            <Navbar />
            <AppRoutes />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
