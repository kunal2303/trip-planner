import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, ExternalLink, Star } from 'lucide-react'
import { subscribeSub, addItem, updateItem, deleteItem } from '../lib/firestore'
import Modal from '../components/Modal'

const CATEGORIES = ['Restaurant', 'Attraction', 'Museum', 'Beach', 'Hotel', 'Bar', 'Shop', 'Park', 'Other']

export default function PlacesPage() {
  const { tripId } = useParams()
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState({ name: '', category: 'Restaurant', address: '', mapsUrl: '', notes: '', visited: false })

  useEffect(() => subscribeSub(tripId, 'places', setItems), [tripId])

  const handleAdd = async (e) => {
    e.preventDefault()
    await addItem(tripId, 'places', form)
    setShowModal(false)
    setForm({ name: '', category: 'Restaurant', address: '', mapsUrl: '', notes: '', visited: false })
  }

  const cats = ['All', ...new Set(items.map(i => i.category))]
  const filtered = filter === 'All' ? items : items.filter(i => i.category === filter)

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-800">Places</h2>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium">
          <Plus size={14} /> Add
        </button>
      </div>

      {cats.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${filter === c ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-500 border-gray-300'}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">No places saved.</p>
      )}

      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className={`bg-white rounded-xl p-3 shadow-sm border flex gap-3 ${item.visited ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-medium text-sm ${item.visited ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.name}</p>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">{item.category}</span>
              </div>
              {item.address && <p className="text-xs text-gray-400 mt-0.5">{item.address}</p>}
              {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
              {item.mapsUrl && (
                <a href={item.mapsUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-500 mt-1">
                  <ExternalLink size={11} /> Open Maps
                </a>
              )}
            </div>
            <div className="flex flex-col gap-1 items-center">
              <button onClick={() => updateItem(tripId, 'places', item.id, { visited: !item.visited })}
                className={`p-1 rounded-lg ${item.visited ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
                <Star size={16} fill={item.visited ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => deleteItem(tripId, 'places', item.id)} className="text-gray-300 hover:text-red-400 p-1">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Save Place">
        <form onSubmit={handleAdd} className="space-y-3">
          <input required placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input placeholder="Google Maps URL" value={form.mapsUrl} onChange={e => setForm(f => ({ ...f, mapsUrl: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium">Save Place</button>
        </form>
      </Modal>
    </div>
  )
}
