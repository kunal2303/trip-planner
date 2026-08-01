import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CalendarDays, MapPin, Wallet, Package, FileText,
  Clock, ExternalLink, CheckCircle, Circle, UserPlus,
} from 'lucide-react'
import { getTripByShareToken, getSubCollection, joinTrip } from '../lib/firestore'
import { useAuth } from '../contexts/AuthContext'

const CAT_EMOJI = { Restaurant: '🍜', Attraction: '🗺', Museum: '🏛', Beach: '🏖', Hotel: '🏨', Bar: '🍸', Shop: '🛒', Park: '🌳', Other: '📍' }

const ALL_TABS = [
  { key: 'itinerary', label: 'Plan',     icon: CalendarDays },
  { key: 'expenses',  label: 'Expenses', icon: Wallet },
  { key: 'packing',   label: 'Packing',  icon: Package },
  { key: 'places',    label: 'Places',   icon: MapPin },
  { key: 'notes',     label: 'Notes',    icon: FileText },
]

export default function SharedTripPage() {
  const { shareToken } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trip, setTrip] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState(null)

  const [itinerary, setItinerary] = useState([])
  const [expenses, setExpenses] = useState([])
  const [packing, setPacking] = useState([])
  const [places, setPlaces] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)

  useEffect(() => {
    getTripByShareToken(shareToken)
      .then(t => {
        if (!t) { setNotFound(true); return }
        setTrip(t)
        const visibleTabs = getVisibleTabs(t)
        setTab(visibleTabs[0]?.key || 'itinerary')
      })
      .catch(() => setNotFound(true))
  }, [shareToken])

  useEffect(() => {
    if (!trip) return
    const unsubs = [
      getSubCollection(trip.id, 'itinerary', setItinerary),
      getSubCollection(trip.id, 'expenses', setExpenses),
      getSubCollection(trip.id, 'packing', setPacking),
      getSubCollection(trip.id, 'places', setPlaces),
      getSubCollection(trip.id, 'notes', setNotes),
    ]
    return () => unsubs.forEach(u => u())
  }, [trip])

  const getVisibleTabs = (t) => {
    const allowed = t?.sharedSections
    if (!allowed || allowed.length === 0) return ALL_TABS
    return ALL_TABS.filter(t => allowed.includes(t.key))
  }

  const [joinError, setJoinError] = useState('')

  const handleJoin = async () => {
    if (!user || saving) return
    setSaving(true)
    setJoinError('')
    try {
      await joinTrip(trip.id, user.uid)
      navigate(`/trip/${trip.id}/itinerary`)
    } catch (e) {
      console.error('joinTrip error:', e)
      setJoinError(e.message || 'Failed to join')
      setSaving(false)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
          <MapPin size={28} className="text-indigo-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Trip not found</h1>
        <p className="text-gray-500 text-sm">This link may have expired or sharing has been disabled.</p>
        <a href="/" className="mt-6 inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-2xl">
          Plan your own trip →
        </a>
      </div>
    )
  }

  if (!trip || !tab) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const visibleTabs = getVisibleTabs(trip)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4">
        <div className="max-w-lg mx-auto h-14 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate leading-tight">{trip.name}</h1>
            {trip.destination && <p className="text-xs text-gray-400 truncate">{trip.destination}</p>}
          </div>
          {user ? (
            user.uid === trip.uid ? (
              <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full shrink-0">Your trip</span>
            ) : trip.members?.includes(user.uid) ? (
              <button onClick={() => navigate(`/trip/${trip.id}/itinerary`)}
                className="text-xs font-medium bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full shrink-0">
                Open trip →
              </button>
            ) : (
              <button onClick={handleJoin} disabled={saving}
                className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-full shrink-0 disabled:opacity-60">
                <UserPlus size={12} />
                {saving ? 'Joining…' : 'Join trip'}
              </button>
            )
          ) : (
            <a href="/" className="text-xs text-indigo-500 font-medium bg-indigo-50 px-2.5 py-1 rounded-full shrink-0">
              Sign in to join
            </a>
          )}
        </div>
      </header>

      {/* Content */}
      {joinError && (
        <div className="max-w-lg mx-auto px-4 pt-3">
          <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{joinError}</p>
        </div>
      )}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-4 pb-nav overflow-y-auto">
        {tab === 'itinerary' && <SharedItinerary items={itinerary} />}
        {tab === 'expenses'  && <SharedExpenses  items={expenses} />}
        {tab === 'packing'   && <SharedPacking   items={packing} />}
        {tab === 'places'    && <SharedPlaces     items={places} />}
        {tab === 'notes'     && <SharedNotes      notes={notes} selected={selectedNote} onSelect={setSelectedNote} />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-30 safe-bottom">
        <div className="flex max-w-lg mx-auto">
          {visibleTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSelectedNote(null) }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-medium transition-colors ${
                tab === key ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${tab === key ? 'bg-indigo-50' : ''}`}>
                <Icon size={18} />
              </div>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

function SharedItinerary({ items }) {
  const byDay = items.reduce((acc, item) => {
    const day = item.date || 'No date'
    ;(acc[day] = acc[day] || []).push(item)
    return acc
  }, {})
  const days = Object.keys(byDay).sort()

  if (items.length === 0) return (
    <div className="text-center py-16">
      <Clock size={24} className="text-indigo-300 mx-auto mb-3" />
      <p className="text-gray-400 text-sm">No activities planned yet</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {days.map(day => (
        <div key={day}>
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">
            {day !== 'No date'
              ? new Date(day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
              : 'No date'}
          </p>
          <div className="relative pl-5">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
            <div className="space-y-3">
              {byDay[day].map(item => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-5 top-3 w-3 h-3 rounded-full bg-white border-2 border-indigo-400" />
                  <div className="card p-4">
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      {item.time && (
                        <span className="flex items-center gap-1 text-xs text-indigo-500 font-medium">
                          <Clock size={11} />{item.time}
                        </span>
                      )}
                      {item.location && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={11} />{item.location}
                        </span>
                      )}
                    </div>
                    {item.mapsUrl && (
                      <a href={item.mapsUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-500 font-medium mt-1.5">
                        <ExternalLink size={11} /> View on Maps
                      </a>
                    )}
                    {item.notes && <p className="text-xs text-gray-400 mt-2 leading-relaxed">{item.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SharedExpenses({ items }) {
  const currencies = [...new Set(items.map(i => i.currency).filter(Boolean))]
  const [currency, setCurrency] = useState(currencies[0] || 'INR')

  useEffect(() => {
    if (currencies.length && !currencies.includes(currency)) setCurrency(currencies[0])
  }, [currencies.join()])

  const filtered = items.filter(i => i.currency === currency)
  const total = filtered.reduce((s, i) => s + parseFloat(i.amount || 0), 0)

  if (items.length === 0) return (
    <div className="text-center py-16">
      <Wallet size={24} className="text-indigo-300 mx-auto mb-3" />
      <p className="text-gray-400 text-sm">No expenses recorded</p>
    </div>
  )

  return (
    <div>
      <div className="bg-blue-600 text-white rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-blue-200 text-sm">Total</p>
          {currencies.length > 1 && (
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="text-xs bg-blue-500 text-white border-none rounded-lg px-2 py-0.5 focus:outline-none">
              {currencies.map(c => <option key={c}>{c}</option>)}
            </select>
          )}
        </div>
        <p className="text-3xl font-bold">{currency} {total.toFixed(2)}</p>
      </div>
      <div className="space-y-2">
        {[...items].reverse().map(item => (
          <div key={item.id} className="card p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">{item.title}</p>
              <p className="text-xs text-gray-400">{item.category}{item.date ? ` · ${item.date}` : ''}{item.paidBy ? ` · ${item.paidBy}` : ''}</p>
              {item.notes && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.notes}</p>}
            </div>
            <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">{item.currency} {parseFloat(item.amount || 0).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SharedPacking({ items }) {
  const unpacked = items.filter(i => !i.packed)
  const packed = items.filter(i => i.packed)
  const pct = items.length ? Math.round((packed.length / items.length) * 100) : 0

  if (items.length === 0) return (
    <div className="text-center py-16">
      <Package size={24} className="text-indigo-300 mx-auto mb-3" />
      <p className="text-gray-400 text-sm">No packing list yet</p>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-base font-bold text-gray-900">Packing List</h2>
        <p className="text-xs text-gray-400">{packed.length}/{items.length} packed</p>
      </div>
      <div className="mb-4">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-indigo-500 font-medium mt-1">{pct}% packed</p>
      </div>
      <div className="space-y-2">
        {unpacked.map(item => (
          <div key={item.id} className="card flex items-center gap-3 px-4 py-3">
            <Circle size={20} className="text-gray-300 shrink-0" />
            <span className="flex-1 text-sm text-gray-800 font-medium">{item.name}</span>
          </div>
        ))}
      </div>
      {packed.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-5 mb-2">Packed</p>
          <div className="space-y-2">
            {packed.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100">
                <CheckCircle size={20} className="text-indigo-400 shrink-0" />
                <span className="flex-1 text-sm text-gray-400 line-through">{item.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SharedPlaces({ items }) {
  if (items.length === 0) return (
    <div className="text-center py-16">
      <MapPin size={24} className="text-indigo-300 mx-auto mb-3" />
      <p className="text-gray-400 text-sm">No places saved</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className={`card p-4 ${item.visited ? 'opacity-60' : ''}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">
              {CAT_EMOJI[item.category] || '📍'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${item.visited ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.name}</p>
              {item.address && <p className="text-xs text-gray-400 mt-0.5">{item.address}</p>}
              {item.notes && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.notes}</p>}
              {item.mapsUrl && (
                <a href={item.mapsUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-500 font-medium mt-1.5">
                  <ExternalLink size={11} /> View on Maps
                </a>
              )}
            </div>
            {item.visited && <CheckCircle size={18} className="text-indigo-400 shrink-0 mt-0.5" />}
          </div>
        </div>
      ))}
    </div>
  )
}

function SharedNotes({ notes, selected, onSelect }) {
  if (selected) {
    return (
      <div>
        <button onClick={() => onSelect(null)} className="flex items-center gap-1 text-indigo-600 text-sm font-semibold mb-4">
          ← Notes
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-3">{selected.title || 'Untitled'}</h2>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selected.content || 'Empty note'}</p>
      </div>
    )
  }

  if (notes.length === 0) return (
    <div className="text-center py-16">
      <span className="text-4xl block mb-3">📝</span>
      <p className="text-gray-400 text-sm">No notes yet</p>
    </div>
  )

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-5">Notes</h2>
      <div className="space-y-2">
        {notes.map(note => (
          <div key={note.id} className="card flex items-center gap-3 p-4 cursor-pointer active:scale-[0.99] transition-all"
            onClick={() => onSelect(note)}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{note.title || 'Untitled'}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{note.content || 'Empty'}</p>
            </div>
            <ExternalLink size={14} className="text-gray-300 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
