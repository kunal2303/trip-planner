import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Clock, MapPin } from 'lucide-react'
import { subscribeSub, addItem, deleteItem } from '../lib/firestore'
import Modal from '../components/Modal'

export default function ItineraryPage() {
  const { tripId } = useParams()
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ date: '', time: '', title: '', location: '', notes: '' })

  useEffect(() => subscribeSub(tripId, 'itinerary', setItems), [tripId])

  const byDay = items.reduce((acc, item) => {
    const day = item.date || 'No date'
    ;(acc[day] = acc[day] || []).push(item)
    return acc
  }, {})
  const days = Object.keys(byDay).sort()

  const handleAdd = async (e) => {
    e.preventDefault()
    await addItem(tripId, 'itinerary', form)
    setShowModal(false)
    setForm({ date: '', time: '', title: '', location: '', notes: '' })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-base font-bold text-gray-900">Itinerary</h2>
        <button onClick={() => setShowModal(true)} className="btn-ghost border border-indigo-200">
          <Plus size={15} /> Add
        </button>
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
            {/* Timeline */}
            <div className="relative pl-5">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
              <div className="space-y-3">
                {byDay[day].map((item, i) => (
                  <div key={item.id} className="relative">
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
                          {item.notes && <p className="text-xs text-gray-400 mt-2 leading-relaxed">{item.notes}</p>}
                        </div>
                        <button onClick={() => deleteItem(tripId, 'itinerary', item.id)}
                          className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg transition shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Activity">
        <form onSubmit={handleAdd} className="space-y-3">
          <input required placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="field" />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="field" />
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="field" />
          </div>
          <input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="field" />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="field resize-none" />
          <button type="submit" className="btn-primary">Add Activity</button>
        </form>
      </Modal>
    </div>
  )
}
