import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Calendar, Trash2, LogOut, Plane } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripContext'
import Modal from '../components/Modal'

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TripsPage() {
  const { logout, user } = useAuth()
  const { trips, loading, createTrip, deleteTrip, setActiveTrip } = useTrips()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', destination: '', startDate: '', endDate: '' })
  const [saving, setSaving] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const ref = await createTrip(form)
    setSaving(false)
    setShowModal(false)
    setForm({ name: '', destination: '', startDate: '', endDate: '' })
    navigate(`/trip/${ref.id}`)
  }

  const openTrip = (trip) => {
    setActiveTrip(trip)
    navigate(`/trip/${trip.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 pt-12 pb-6 safe-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Plane size={20} />
              <span className="font-bold text-lg">Trip Planner</span>
            </div>
            <p className="text-blue-200 text-sm mt-0.5">{user?.displayName}</p>
          </div>
          <button onClick={logout} className="p-2 rounded-full hover:bg-blue-700 transition">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">My Trips</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={16} /> New Trip
          </button>
        </div>

        {loading && <p className="text-gray-400 text-center py-12">Loading…</p>}

        {!loading && trips.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Plane size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No trips yet</p>
            <p className="text-sm">Tap "New Trip" to get started</p>
          </div>
        )}

        <div className="space-y-3">
          {trips.map(trip => (
            <div
              key={trip.id}
              onClick={() => openTrip(trip)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{trip.name}</h3>
                  {trip.destination && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                      <MapPin size={13} />
                      <span>{trip.destination}</span>
                    </div>
                  )}
                  {(trip.startDate || trip.endDate) && (
                    <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                      <Calendar size={12} />
                      <span>{fmtDate(trip.startDate)} — {fmtDate(trip.endDate)}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteTrip(trip.id) }}
                  className="p-2 text-gray-300 hover:text-red-400 transition rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Trip">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trip name *</label>
            <input
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Summer in Japan"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <input
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Tokyo, Japan"
              value={form.destination}
              onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? 'Creating…' : 'Create Trip'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
