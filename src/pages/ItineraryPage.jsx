import { useState, useEffect } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { Plus, Trash2, Clock, MapPin, Pencil, ExternalLink, Navigation } from 'lucide-react'
import { subscribeSub, addItem, updateItem, deleteItem } from '../lib/firestore'
import Modal from '../components/Modal'

const EMPTY = { date: '', time: '', title: '', location: '', mapsUrl: '', notes: '' }

function parseCoords(mapsUrl) {
  if (!mapsUrl) return null
  // @lat,lng,zoom or @lat,lng
  let m = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  // ?q=lat,lng
  m = mapsUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  // /place/.../@lat,lng or ll=lat,lng
  m = mapsUrl.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  return null
}

async function fetchDrivingDistance(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) return null
  const meters = route.distance
  const seconds = route.duration
  const dist = meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`
  const mins = Math.round(seconds / 60)
  const time = mins >= 60
    ? `${Math.floor(mins / 60)}h ${mins % 60}m`
    : `${mins} min`
  return `${dist} · ${time}`
}

function DirectionsChip({ from, to }) {
  const [dist, setDist] = useState(null)
  const [loading, setLoading] = useState(false)

  const fromC = parseCoords(from?.mapsUrl)
  const toC = parseCoords(to?.mapsUrl)
  const hasCoords = fromC && toC
  const hasLocations = from?.location && to?.location

  useEffect(() => {
    if (!hasCoords) return
    setLoading(true)
    fetchDrivingDistance(fromC, toC)
      .then(d => setDist(d))
      .finally(() => setLoading(false))
  }, [from?.mapsUrl, to?.mapsUrl])

  if (!hasCoords && !hasLocations) return null

  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&origin=${fromC.lat},${fromC.lng}&destination=${toC.lat},${toC.lng}`
    : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from.location)}&destination=${encodeURIComponent(to.location)}`

  return (
    <div className="flex items-center gap-2 py-1 pl-1">
      <a href={directionsUrl} target="_blank" rel="noreferrer"
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-500 transition">
        <Navigation size={11} className="shrink-0" />
        {loading ? '…' : dist || 'Directions →'}
      </a>
    </div>
  )
}

export default function ItineraryPage() {
  const { tripId } = useParams()
  const { isOwner, sharedSections } = useOutletContext() || {}
  const canEdit = isOwner || sharedSections?.includes('itinerary')
  const [items, setItems] = useState([])
  const [places, setPlaces] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(EMPTY)

  useEffect(() => subscribeSub(tripId, 'itinerary', canEdit ? setItems : () => {}), [tripId, canEdit])
  useEffect(() => subscribeSub(tripId, 'places', setPlaces), [tripId])

  const byDay = items.reduce((acc, item) => {
    const day = item.date || 'No date'
    ;(acc[day] = acc[day] || []).push(item)
    return acc
  }, {})
  const days = Object.keys(byDay).sort()

  const openAdd = () => { setEditingItem(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (item) => {
    setEditingItem(item)
    setForm({ date: item.date || '', time: item.time || '', title: item.title || '', location: item.location || '', mapsUrl: item.mapsUrl || '', notes: item.notes || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editingItem) {
      await updateItem(tripId, 'itinerary', editingItem.id, form)
    } else {
      await addItem(tripId, 'itinerary', form)
    }
    setShowModal(false)
    setForm(EMPTY)
    setEditingItem(null)
  }

  const pickPlace = (place) => {
    setForm(f => ({ ...f, location: place.name + (place.address ? `, ${place.address}` : ''), mapsUrl: place.mapsUrl || '' }))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-base font-bold text-gray-900">Itinerary</h2>
        {canEdit && (
          <button onClick={openAdd} className="btn-ghost border border-indigo-200">
            <Plus size={15} /> Add
          </button>
        )}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Clock size={24} className="text-indigo-400" />
          </div>
          <p className="text-gray-500 font-medium">No activities yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first activity</p>
        </div>
      )}

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
                {byDay[day].map((item, idx) => (
                  <div key={item.id}>
                    <div className="relative">
                      <div className="absolute -left-5 top-3 w-3 h-3 rounded-full bg-white border-2 border-indigo-400" />
                      <div className="card p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
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
                          <div className="flex items-center gap-1 shrink-0">
                            {canEdit && (<>
                              <button onClick={() => openEdit(item)}
                                className="p-1.5 text-gray-300 hover:text-indigo-400 rounded-lg transition">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => deleteItem(tripId, 'itinerary', item.id)}
                                className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg transition">
                                <Trash2 size={14} />
                              </button>
                            </>)}
                          </div>
                        </div>
                      </div>
                    </div>
                    {idx < byDay[day].length - 1 && (
                      <DirectionsChip from={item} to={byDay[day][idx + 1]} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingItem(null) }} title={editingItem ? 'Edit Activity' : 'Add Activity'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="Title *" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="field" />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="field" />
            <input type="time" value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="field" />
          </div>

          {/* Pick from saved places */}
          {places.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Pick from saved places</p>
              <select
                className="field"
                value=""
                onChange={e => {
                  const place = places.find(p => p.id === e.target.value)
                  if (place) {
                    setForm(f => ({
                      ...f,
                      title: f.title || place.name,
                      location: place.address || '',
                      mapsUrl: place.mapsUrl || '',
                    }))
                  }
                }}
              >
                <option value="">— select a place —</option>
                {places.map(p => (
                  <option key={p.id} value={p.id}>{p.name}{p.address ? ` · ${p.address}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          <input placeholder="Location" value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="field" />
          <input placeholder="Maps URL" value={form.mapsUrl}
            onChange={e => setForm(f => ({ ...f, mapsUrl: e.target.value }))} className="field" />
          <textarea placeholder="Notes" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="field resize-none" />
          <button type="submit" className="btn-primary">{editingItem ? 'Save Changes' : 'Add Activity'}</button>
        </form>
      </Modal>
    </div>
  )
}
