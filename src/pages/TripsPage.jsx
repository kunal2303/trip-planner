import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Calendar, Trash2, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripContext'
import Modal from '../components/Modal'

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function tripDays(start, end) {
  if (!start || !end) return null
  const diff = Math.round((new Date(end) - new Date(start)) / 86400000)
  return diff > 0 ? `${diff + 1} days` : null
}

const COVER_COLORS = [
  'from-indigo-400 to-purple-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-indigo-500',
]

function tripColor(id) {
  const idx = id ? id.charCodeAt(0) % COVER_COLORS.length : 0
  return COVER_COLORS[idx]
}

export default function TripsPage() {
  const { logout, user } = useAuth()
  const { trips, loading, error: tripError, createTrip, deleteTrip, setActiveTrip } = useTrips()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', destination: '', startDate: '', endDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    try {
      const ref = await createTrip(form)
      setSaving(false)
      setShowModal(false)
      setForm({ name: '', destination: '', startDate: '', endDate: '' })
      navigate(`/trip/${ref.id}`)
    } catch (err) {
      setSaving(false)
      setError(err.message || 'Failed to create trip.')
    }
  }

  const openTrip = (trip) => {
    setActiveTrip(trip)
    navigate(`/trip/${trip.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 safe-top">
        <div className="max-w-lg mx-auto flex items-center justify-between h-16">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Trips</h1>
            <p className="text-xs text-gray-400 -mt-0.5">{user?.displayName}</p>
          </div>
          <button onClick={logout} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-5 pb-nav">

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {tripError && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600 mb-4">
            {tripError}
          </div>
        )}

        {!loading && trips.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <MapPin size={28} className="text-indigo-400" />
            </div>
            <p className="font-semibold text-gray-700 text-lg">No trips yet</p>
            <p className="text-gray-400 text-sm mt-1">Plan your first adventure</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-5 inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition"
            >
              <Plus size={16} /> New Trip
            </button>
          </div>
        )}

        <div className="space-y-3">
          {trips.map(trip => (
            <div
              key={trip.id}
              onClick={() => openTrip(trip)}
              className="card overflow-hidden cursor-pointer hover:shadow-md active:scale-[0.99] transition-all"
            >
              {/* Color bar */}
              <div className={`h-1.5 bg-gradient-to-r ${tripColor(trip.id)}`} />
              <div className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate text-base">{trip.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    {trip.destination && (
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <MapPin size={11} />{trip.destination}
                      </div>
                    )}
                    {(trip.startDate || trip.endDate) && (
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <Calendar size={11} />
                        {fmtDate(trip.startDate)}{trip.endDate ? ` – ${fmtDate(trip.endDate)}` : ''}
                        {tripDays(trip.startDate, trip.endDate) && (
                          <span className="text-indigo-400 ml-1">· {tripDays(trip.startDate, trip.endDate)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDelete(trip) }}
                    className="p-2 text-gray-300 hover:text-red-400 rounded-xl transition"
                  >
                    <Trash2 size={15} />
                  </button>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FAB */}
      {!loading && trips.length > 0 && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-6 right-5 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-300 flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all z-40"
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        >
          <Plus size={24} />
        </button>
      )}

      {/* New Trip Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Trip">
        <form onSubmit={handleCreate} className="space-y-3">
          <input className="field" placeholder="Trip name *" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <input className="field" placeholder="Destination (e.g. Tokyo, Japan)" value={form.destination}
            onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block pl-1">Start</label>
              <input type="date" className="field" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block pl-1">End</label>
              <input type="date" className="field" value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Creating…' : 'Create Trip'}
          </button>
        </form>
      </Modal>

      {/* Delete confirm Modal */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Trip">
        <p className="text-gray-600 text-sm mb-5">
          Delete <strong>{confirmDelete?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmDelete(null)}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-600">
            Cancel
          </button>
          <button
            onClick={() => { deleteTrip(confirmDelete.id); setConfirmDelete(null) }}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-semibold">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}
