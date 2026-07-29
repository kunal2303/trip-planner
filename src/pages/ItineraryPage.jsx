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
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800">Itinerary</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-center text-gray-400 py-12 text-sm">No activities yet. Add your first!</p>
      )}

      <div className="space-y-6">
        {days.map(day => (
          <div key={day}>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
              {day !== 'No date' ? new Date(day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'No date'}
            </div>
            <div className="space-y-2">
              {byDay[day].map(item => (
                <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex gap-3">
                  {item.time && (
                    <div className="flex items-start gap-1 text-gray-400 text-xs pt-0.5 w-12 shrink-0">
                      <Clock size={12} className="mt-0.5" />{item.time}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                    {item.location && (
                      <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                        <MapPin size={11} />{item.location}
                      </div>
                    )}
                    {item.notes && <p className="text-gray-500 text-xs mt-1">{item.notes}</p>}
                  </div>
                  <button onClick={() => deleteItem(tripId, 'itinerary', item.id)} className="text-gray-300 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Activity">
        <form onSubmit={handleAdd} className="space-y-3">
          <input required placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium">Add Activity</button>
        </form>
      </Modal>
    </div>
  )
}
