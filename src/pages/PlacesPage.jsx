import { useState, useEffect } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { Plus, Trash2, ExternalLink, CheckCircle, Circle, Pencil } from 'lucide-react'
import { subscribeSub, syncedAddItem, syncedUpdateItem, syncedDeleteItem } from '../lib/firestore'
import Modal from '../components/Modal'

const CATEGORIES = ['Restaurant', 'Attraction', 'Museum', 'Beach', 'Hotel', 'Bar', 'Shop', 'Park', 'Other']
const CAT_EMOJI = { Restaurant: '🍜', Attraction: '🗺', Museum: '🏛', Beach: '🏖', Hotel: '🏨', Bar: '🍸', Shop: '🛒', Park: '🌳', Other: '📍' }

const EMPTY = { name: '', category: 'Restaurant', address: '', mapsUrl: '', notes: '', visited: false }

export default function PlacesPage() {
  const { tripId } = useParams()
  const { activeTrip } = useOutletContext() || {}
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState(EMPTY)

  useEffect(() => subscribeSub(tripId, 'places', setItems), [tripId])

  const openAdd = () => { setEditingItem(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (item) => {
    setEditingItem(item)
    setForm({ name: item.name || '', category: item.category || 'Restaurant', address: item.address || '', mapsUrl: item.mapsUrl || '', notes: item.notes || '', visited: item.visited || false })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editingItem) {
      await syncedUpdateItem(activeTrip, 'places', editingItem.id, form)
    } else {
      await syncedAddItem(activeTrip, 'places', form)
    }
    setShowModal(false)
    setEditingItem(null)
    setForm(EMPTY)
  }

  const cats = ['All', ...new Set(items.map(i => i.category))]
  const filtered = filter === 'All' ? items : items.filter(i => i.category === filter)
  const visitedCount = items.filter(i => i.visited).length

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-base font-bold text-gray-900">Places</h2>
          {items.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{visitedCount}/{items.length} visited</p>
          )}
        </div>
        <button onClick={openAdd} className="btn-ghost border border-indigo-200">
            <Plus size={15} /> Add
          </button>
      </div>

      {/* Category filter */}
      {cats.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-4 px-4">
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium border transition ${
                filter === c ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-500 border-gray-200 bg-white'
              }`}>
              {CAT_EMOJI[c] || ''} {c}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📍</span>
          </div>
          <p className="text-gray-500 font-medium">No places saved</p>
          <p className="text-gray-400 text-sm mt-1">Add spots you want to visit</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className={`card p-4 transition ${item.visited ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">
                {CAT_EMOJI[item.category] || '📍'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm ${item.visited ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.name}</p>
                </div>
                {item.address && <p className="text-xs text-gray-400 mt-0.5">{item.address}</p>}
                {item.notes && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.notes}</p>}
                {item.mapsUrl && (
                  <a href={item.mapsUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-500 font-medium mt-1.5">
                    <ExternalLink size={11} /> View on Maps
                  </a>
                )}
              </div>
              <div className="flex flex-col gap-1.5 items-center shrink-0">
                <button onClick={() => syncedUpdateItem(activeTrip, 'places', item.id, { visited: !item.visited })}
                  className="text-gray-300 hover:text-indigo-500 transition">
                  {item.visited
                    ? <CheckCircle size={20} className="text-indigo-500" />
                    : <Circle size={20} />}
                </button>
                <button onClick={() => openEdit(item)} className="p-1 text-gray-300 hover:text-indigo-400 transition">
                  <Pencil size={14} />
                </button>
                <button onClick={() => syncedDeleteItem(activeTrip, 'places', item.id)} className="p-1 text-gray-300 hover:text-red-400 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingItem(null) }} title={editingItem ? 'Edit Place' : 'Save Place'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="field" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition ${
                  form.category === c ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                {CAT_EMOJI[c]} {c}
              </button>
            ))}
          </div>
          <input placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="field" />
          <input placeholder="Google Maps URL" value={form.mapsUrl} onChange={e => setForm(f => ({ ...f, mapsUrl: e.target.value }))} className="field" />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="field resize-none" />
          <button type="submit" className="btn-primary">{editingItem ? 'Save Changes' : 'Save Place'}</button>
        </form>
      </Modal>
    </div>
  )
}
