import { useParams, useNavigate, NavLink, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowLeft, CalendarDays, Ticket, Wallet, Package, MapPin, FileText } from 'lucide-react'
import { useTrips } from '../contexts/TripContext'

const tabs = [
  { to: 'itinerary', label: 'Itinerary', icon: CalendarDays },
  { to: 'tickets',   label: 'Tickets',   icon: Ticket },
  { to: 'expenses',  label: 'Expenses',  icon: Wallet },
  { to: 'packing',   label: 'Packing',   icon: Package },
  { to: 'places',    label: 'Places',    icon: MapPin },
  { to: 'notes',     label: 'Notes',     icon: FileText },
]

export default function TripLayout() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { trips, setActiveTrip, activeTrip } = useTrips()

  useEffect(() => {
    const trip = trips.find(t => t.id === tripId)
    if (trip) setActiveTrip(trip)
  }, [trips, tripId])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 pt-10 pb-3">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-blue-200 text-sm mb-1">
            <ArrowLeft size={14} /> All trips
          </button>
          <h1 className="text-xl font-bold truncate">{activeTrip?.name || '…'}</h1>
          {activeTrip?.destination && (
            <p className="text-blue-200 text-sm">{activeTrip.destination}</p>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <nav className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex max-w-lg mx-auto">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors min-w-[60px] ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}
