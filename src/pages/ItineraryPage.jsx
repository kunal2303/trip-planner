import { useState, useEffect } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { Plus, Trash2, Clock, MapPin, Pencil, ExternalLink, Navigation, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { subscribeSub, addItem, updateItem, deleteItem } from '../lib/firestore'
import Modal from '../components/Modal'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const EMPTY = { date: '', time: '', title: '', location: '', mapsUrl: '', lat: null, lng: null, notes: '' }

function parseCoords(url) {
  if (!url) return null
  let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  m = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  return null
}

async function resolveCoords(mapsUrl) {
  if (!mapsUrl) return null
  const direct = parseCoords(mapsUrl)
  if (direct) return direct
  try {
    const res = await fetch(`/api/resolve-coords?url=${encodeURIComponent(mapsUrl)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.lat && data.lng) return { lat: data.lat, lng: data.lng }
  } catch {}
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

  const hasRef = !!(from?.mapsUrl || from?.location) && !!(to?.mapsUrl || to?.location)

  useEffect(() => {
    if (!hasRef) return
    setLoading(true)
    Promise.all([
      (from?.lat && from?.lng) ? Promise.resolve({ lat: from.lat, lng: from.lng }) : resolveCoords(from?.mapsUrl),
      (to?.lat && to?.lng) ? Promise.resolve({ lat: to.lat, lng: to.lng }) : resolveCoords(to?.mapsUrl),
    ]).then(([fromC, toC]) => {
      if (fromC && toC) return fetchDrivingDistance(fromC, toC)
      return null
    }).then(d => setDist(d)).finally(() => setLoading(false))
  }, [from?.mapsUrl, from?.lat, to?.mapsUrl, to?.lat])

  if (!hasRef) return null

  const fromC = (from?.lat && from?.lng) ? { lat: from.lat, lng: from.lng } : parseCoords(from?.mapsUrl)
  const toC = (to?.lat && to?.lng) ? { lat: to.lat, lng: to.lng } : parseCoords(to?.mapsUrl)
  const directionsUrl = (fromC && toC)
    ? `https://www.google.com/maps/dir/?api=1&origin=${fromC.lat},${fromC.lng}&destination=${toC.lat},${toC.lng}`
    : from?.location && to?.location
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from.location)}&destination=${encodeURIComponent(to.location)}`
      : to?.mapsUrl || '#'

  return (
    <div className="flex items-center gap-2 py-1.5 pl-1">
      <a href={directionsUrl} target="_blank" rel="noreferrer"
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-500 transition">
        <Navigation size={11} className="shrink-0" />
        {loading ? '…' : dist || 'Directions →'}
      </a>
    </div>
  )
}

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-50' : ''}>
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
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
  const [openDay, setOpenDay] = useState(null)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  useEffect(() => subscribeSub(tripId, 'itinerary', canEdit ? setItems : () => {}), [tripId, canEdit])
  useEffect(() => subscribeSub(tripId, 'places', setPlaces), [tripId])

  const byDay = items.reduce((acc, item) => {
    const day = item.date || 'No date'
    ;(acc[day] = acc[day] || []).push(item)
    return acc
  }, {})
  // Sort each day's items by explicit order, falling back to createdAt
  Object.keys(byDay).forEach(day => {
    byDay[day].sort((a, b) => {
      if (a.order != null && b.order != null) return a.order - b.order
      if (a.order != null) return -1
      if (b.order != null) return 1
      return 0
    })
  })
  const days = Object.keys(byDay).sort()

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    // Find which day this drag happened in
    for (const day of days) {
      const dayItems = byDay[day]
      const oldIndex = dayItems.findIndex(i => i.id === active.id)
      const newIndex = dayItems.findIndex(i => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) continue
      const reordered = arrayMove(dayItems, oldIndex, newIndex)
      reordered.forEach((item, idx) => updateItem(tripId, 'itinerary', item.id, { order: idx }))
      break
    }
  }

  useEffect(() => {
    if (days.length > 0 && openDay === null) setOpenDay(days[0])
  }, [days.length])

  const startDate = days.find(d => d !== 'No date')
  const getDayLabel = (dateStr) => {
    if (dateStr === 'No date' || !startDate) return null
    const start = new Date(startDate + 'T00:00:00')
    const current = new Date(dateStr + 'T00:00:00')
    const diff = Math.round((current - start) / 86400000)
    return diff >= 0 ? `Day ${diff + 1}` : null
  }

  const toggleCollapsed = (day) => setOpenDay(prev => prev === day ? null : day)

  const openAdd = () => { setEditingItem(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (item) => {
    setEditingItem(item)
    setForm({ date: item.date || '', time: item.time || '', title: item.title || '', location: item.location || '', mapsUrl: item.mapsUrl || '', notes: item.notes || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const coords = await resolveCoords(form.mapsUrl)
    const data = { ...form, lat: coords?.lat || null, lng: coords?.lng || null }
    if (editingItem) {
      await updateItem(tripId, 'itinerary', editingItem.id, data)
    } else {
      await addItem(tripId, 'itinerary', data)
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

      <div className="space-y-4">
        {days.map(day => {
          const isCollapsed = openDay !== day
          const dayLabel = getDayLabel(day)
          const dateLabel = day !== 'No date'
            ? new Date(day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
            : 'No date'
          return (
            <div key={day}>
              <button
                onClick={() => toggleCollapsed(day)}
                className="w-full flex items-center justify-between mb-3 group"
              >
                <div className="flex items-center gap-2">
                  {dayLabel && (
                    <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                      {dayLabel}
                    </span>
                  )}
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
                    {dateLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <span className="text-xs">{byDay[day].length} {byDay[day].length === 1 ? 'activity' : 'activities'}</span>
                  {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>
              </button>

              {!isCollapsed && (
                <div className="relative pl-5">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={({ active }) => setActiveId(active.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={byDay[day].map(i => i.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {byDay[day].map((item, idx) => (
                          <SortableItem key={item.id} id={item.id}>
                            {({ dragHandleProps }) => (
                              <div>
                                <div className="relative">
                                  <div className="absolute -left-5 top-3 w-3 h-3 rounded-full bg-white border-2 border-indigo-400" />
                                  <div className="card p-4">
                                    <div className="flex items-start justify-between gap-2">
                                      {canEdit && (
                                        <button {...dragHandleProps} className="mt-0.5 p-0.5 text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none shrink-0">
                                          <GripVertical size={14} />
                                        </button>
                                      )}
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
                            )}
                          </SortableItem>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          )
        })}
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
