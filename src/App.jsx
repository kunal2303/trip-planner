import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TripProvider } from './contexts/TripContext'
import LoginPage from './pages/LoginPage'
import TripsPage from './pages/TripsPage'
import TripLayout from './pages/TripLayout'
import ItineraryPage from './pages/ItineraryPage'
import TicketsPage from './pages/TicketsPage'
import ExpensesPage from './pages/ExpensesPage'
import PackingPage from './pages/PackingPage'
import PlacesPage from './pages/PlacesPage'
import NotesPage from './pages/NotesPage'

function AuthGate() {
  const { user } = useAuth()

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <TripProvider>
      <Routes>
        <Route path="/" element={<TripsPage />} />
        <Route path="/trip/:tripId" element={<TripLayout />}>
          <Route index element={<Navigate to="itinerary" replace />} />
          <Route path="itinerary" element={<ItineraryPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="packing" element={<PackingPage />} />
          <Route path="places" element={<PlacesPage />} />
          <Route path="notes" element={<NotesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TripProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </BrowserRouter>
  )
}
