import { useParams, useNavigate, NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Ticket, Wallet, Package, MapPin, FileText, Share2, Check, X } from 'lucide-react'
import { useTrips } from '../contexts/TripContext'
import { useAuth } from '../contexts/AuthContext'

const ALL_TABS = [
  { to: 'itinerary', label: 'Plan',     icon: CalendarDays },
  { to: 'tickets',   label: 'Tickets',  icon: Ticket },
  { to: 'expenses',  label: 'Expenses', icon: Wallet },
  { to: 'packing',   label: 'Packing',  icon: Package },
  { to: 'places',    label: 'Places',   icon: MapPin },
  { to: 'notes',     label: 'Notes',    icon: FileText },
]

const ALL_SECTIONS = ['itinerary', 'tickets', 'expenses', 'packing', 'places', 'notes']
const SECTION_LABELS = { itinerary: 'Plan', tickets: 'Tickets', expenses: 'Expenses', packing: 'Packing', places: 'Places', notes: 'Notes' }

export default function TripLayout() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { trips, setActiveTrip, activeTrip, updateTrip } = useTrips()
  const [showShareModal, setShowShareModal] = useState(false)
  const [sections, setSections] = useState(ALL_SECTIONS)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const trip = trips.find(t => t.id === tripId)
    if (trip) setActiveTrip(trip)
  }, [trips, tripId])

  const isOwner = activeTrip?.uid === user?.uid
  const sharedSections = (activeTrip?.sharedSections?.length > 0) ? activeTrip.sharedSections : ALL_SECTIONS
  const visibleTabs = isOwner
    ? ALL_TABS
    : ALL_TABS.filter(t => sharedSections.includes(t.to))

  const openShareModal = () => {
    setSections(activeTrip?.sharedSections || ALL_SECTIONS)
    setShowShareModal(true)
  }

  const toggleSection = (key) => {
    setSections(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    )
  }

  const handleCopyLink = async () => {
    let token = activeTrip?.shareToken
    if (!token) {
      token = Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12)
    }
    await updateTrip(tripId, { shareToken: token, isPublic: true, sharedSections: sections })
    const url = `${window.location.origin}/s/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => { setCopied(false); setShowShareModal(false) }, 1500)
  }

  const handleStopSharing = async () => {
    await updateTrip(tripId, { isPublic: false })
    setShowShareModal(false)
  }

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
          {isOwner && (
            <button
              onClick={openShareModal}
              className="p-1.5 rounded-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition"
            >
              <Share2 size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-4 pb-nav overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-30 safe-bottom">
        <div className="flex max-w-lg mx-auto">
          {visibleTabs.map(({ to, label, icon: Icon }) => (
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

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Share trip</h3>
              <button onClick={() => setShowShareModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-3">Choose which sections to include</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {ALL_SECTIONS.map(key => (
                <button
                  key={key}
                  onClick={() => toggleSection(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-sm font-medium transition ${
                    sections.includes(key)
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    sections.includes(key) ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                  }`}>
                    {sections.includes(key) && <Check size={10} className="text-white" />}
                  </div>
                  {SECTION_LABELS[key]}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyLink}
              disabled={sections.length === 0}
              className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              {copied ? <><Check size={16} /> Link copied!</> : <><Share2 size={16} /> Copy share link</>}
            </button>

            {activeTrip?.isPublic && (
              <button onClick={handleStopSharing} className="w-full mt-2 py-2.5 text-sm text-red-400 font-medium">
                Stop sharing
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
