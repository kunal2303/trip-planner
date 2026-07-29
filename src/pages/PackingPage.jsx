import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react'
import { subscribeSub, addItem, updateItem, deleteItem } from '../lib/firestore'

const TEMPLATES = {
  'Clothing': ['T-shirts', 'Pants', 'Underwear', 'Socks', 'Jacket', 'Shoes', 'Swimwear'],
  'Toiletries': ['Toothbrush', 'Toothpaste', 'Shampoo', 'Sunscreen', 'Deodorant'],
  'Electronics': ['Phone charger', 'Adapter', 'Headphones', 'Power bank'],
  'Documents': ['Passport', 'Travel insurance', 'Boarding passes', 'Hotel confirmation'],
}

export default function PackingPage() {
  const { tripId } = useParams()
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => subscribeSub(tripId, 'packing', setItems), [tripId])

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

  const packed = items.filter(i => i.packed).length
  const total = items.length

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="font-semibold text-gray-800">Packing List</h2>
        <button onClick={() => setShowTemplates(!showTemplates)}
          className="text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded-lg">
          + Template
        </button>
      </div>

      {total > 0 && (
        <p className="text-sm text-gray-400 mb-3">{packed}/{total} packed</p>
      )}

      {showTemplates && (
        <div className="bg-blue-50 rounded-xl p-3 mb-3 flex flex-wrap gap-2">
          {Object.keys(TEMPLATES).map(cat => (
            <button key={cat} onClick={() => addTemplate(cat)}
              className="bg-white border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-full">
              {cat}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={addSingle} className="flex gap-2 mb-4">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="Add item…"
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 rounded-xl text-sm font-medium">
          <Plus size={16} />
        </button>
      </form>

      {items.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">Nothing to pack yet.</p>
      )}

      <div className="space-y-1.5">
        {items.filter(i => !i.packed).map(item => (
          <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 shadow-sm border border-gray-100">
            <button onClick={() => toggle(item)} className="text-gray-300 hover:text-blue-500 shrink-0">
              <Square size={18} />
            </button>
            <span className="flex-1 text-sm text-gray-800">{item.name}</span>
            <button onClick={() => deleteItem(tripId, 'packing', item.id)} className="text-gray-300 hover:text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {items.some(i => i.packed) && (
          <p className="text-xs text-gray-400 pt-2 pb-1 font-medium">Packed</p>
        )}

        {items.filter(i => i.packed).map(item => (
          <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 opacity-60">
            <button onClick={() => toggle(item)} className="text-blue-400 shrink-0">
              <CheckSquare size={18} />
            </button>
            <span className="flex-1 text-sm text-gray-500 line-through">{item.name}</span>
            <button onClick={() => deleteItem(tripId, 'packing', item.id)} className="text-gray-300 hover:text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
