import { useState, useEffect } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { Plus, Trash2, Check } from 'lucide-react'
import { subscribeSub, addItem, updateItem, deleteItem } from '../lib/firestore'

const TEMPLATES = {
  'Clothing':    ['T-shirts', 'Pants', 'Underwear', 'Socks', 'Jacket', 'Shoes', 'Swimwear'],
  'Toiletries':  ['Toothbrush', 'Toothpaste', 'Shampoo', 'Sunscreen', 'Deodorant'],
  'Electronics': ['Phone charger', 'Adapter', 'Headphones', 'Power bank'],
  'Documents':   ['Passport', 'Travel insurance', 'Boarding passes', 'Hotel confirmation'],
}

export default function PackingPage() {
  const { tripId } = useParams()
  const { isOwner, sharedSections } = useOutletContext() || {}
  const canEdit = isOwner || sharedSections?.includes('packing')
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => subscribeSub(tripId, 'packing', canEdit ? setItems : () => {}), [tripId, canEdit])

  const addSingle = async (e) => {
    e.preventDefault()
    if (!newItem.trim()) return
    await addItem(tripId, 'packing', { name: newItem.trim(), packed: false })
    setNewItem('')
  }

  const toggle = (item) => updateItem(tripId, 'packing', item.id, { packed: !item.packed })

  const addTemplate = async (category) => {
    await Promise.all(TEMPLATES[category].map(name => addItem(tripId, 'packing', { name, packed: false, category })))
    setShowTemplates(false)
  }

  const unpacked = items.filter(i => !i.packed)
  const packed = items.filter(i => i.packed)
  const pct = items.length ? Math.round((packed.length / items.length) * 100) : 0

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">Packing List</h2>
          {items.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{packed.length}/{items.length} packed</p>
          )}
        </div>
        {canEdit && (
          <button onClick={() => setShowTemplates(!showTemplates)}
            className={`btn-ghost border text-xs ${showTemplates ? 'border-indigo-400 bg-indigo-50' : 'border-indigo-200'}`}>
            Templates
          </button>
        )}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-indigo-500 font-medium mt-1">{pct}% packed</p>
        </div>
      )}

      {/* Templates */}
      {showTemplates && (
        <div className="card p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick add</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(TEMPLATES).map(cat => (
              <button key={cat} onClick={() => addTemplate(cat)}
                className="text-left text-sm px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 font-medium transition">
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add input */}
      {canEdit && (
        <form onSubmit={addSingle} className="flex gap-2 mb-5">
          <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add item…" className="field flex-1" />
          <button type="submit" className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shrink-0 hover:bg-indigo-700 active:scale-95 transition">
            <Plus size={20} />
          </button>
        </form>
      )}

      {items.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-400 text-sm">Nothing to pack yet.</p>
        </div>
      )}

      {/* Unpacked */}
      <div className="space-y-2">
        {unpacked.map(item => (
          <div key={item.id} className="card flex items-center gap-3 px-4 py-3">
            <button onClick={() => toggle(item)}
              className="w-6 h-6 rounded-lg border-2 border-gray-300 flex items-center justify-center shrink-0 hover:border-indigo-400 transition">
            </button>
            <span className="flex-1 text-sm text-gray-800 font-medium">{item.name}</span>
            {canEdit && (
              <button onClick={() => deleteItem(tripId, 'packing', item.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Packed */}
      {packed.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-5 mb-2">Packed</p>
          <div className="space-y-2">
            {packed.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100">
                <button onClick={() => toggle(item)}
                  className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
                  <Check size={13} className="text-white" strokeWidth={3} />
                </button>
                <span className="flex-1 text-sm text-gray-400 line-through">{item.name}</span>
                {canEdit && (
                  <button onClick={() => deleteItem(tripId, 'packing', item.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
