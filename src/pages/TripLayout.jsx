import { useParams, useNavigate, NavLink, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowLeft, CalendarDays, Ticket, Wallet, Package, MapPin, FileText } from 'lucide-react'
import { useTrips } from '../contexts/TripContext'

const tabs = [
  { to: 'itinerary', label: 'Plan',     icon: CalendarDays },
  { to: 'tickets',   label: 'Tickets',  icon: Ticket },
  { to: 'expenses',  label: 'Expenses', icon: Wallet },
  { to: 'packing',   label: 'Packing',  icon: Package },
  { to: 'places',    label: 'Places',   icon: MapPin },
  { to: 'notes',     label: 'Notes',    icon: FileText },
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
      <header className="bg-white border-b border-gray-100 px-4 safe-top">
        <div className="max-w-lg mx-auto h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 -ml-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate leading-tight">{activeTrip?.name || '…'}</h1>
            {activeTrip?.destination && (
              <p className="text-xs text-gray-400 truncate">{activeTrip.destination}</p>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-4 pb-nav overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-30 safe-bottom">
        <div className="flex max-w-lg mx-auto">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-indigo-50' : ''}`}>
                    <Icon size={18} />
                  </div>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
