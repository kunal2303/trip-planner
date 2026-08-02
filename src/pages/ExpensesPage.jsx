import { useState, useEffect } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { subscribeSub, syncedAddItem, syncedUpdateItem, syncedDeleteItem } from '../lib/firestore'
import Modal from '../components/Modal'

const CATEGORIES = ['Food', 'Transport', 'Accommodation', 'Activities', 'Shopping', 'Health', 'Other']
const CURRENCIES = ['INR','EUR', 'USD', 'GBP', 'JPY', 'BRL', 'AUD', 'CAD', 'CHF', 'CNY', 'MXN']

const EMPTY = { title: '', amount: '', currency: 'INR', category: 'Food', date: '', paidBy: '', notes: '' }

export default function ExpensesPage() {
  const { tripId } = useParams()
  const { activeTrip, isOwner } = useOutletContext() || {}
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [currency, setCurrency] = useState('INR')
  const [form, setForm] = useState(EMPTY)

  useEffect(() => subscribeSub(tripId, 'expenses', setItems), [tripId])

  const total = items.filter(i => i.currency === currency).reduce((s, i) => s + parseFloat(i.amount || 0), 0)

  const byCat = items.reduce((acc, i) => {
    if (i.currency !== currency) return acc
    acc[i.category] = (acc[i.category] || 0) + parseFloat(i.amount || 0)
    return acc
  }, {})

  const openAdd = () => { setEditingItem(null); setForm({ ...EMPTY, currency }); setShowModal(true) }
  const openEdit = (item) => {
    setEditingItem(item)
    setForm({ title: item.title || '', amount: String(item.amount || ''), currency: item.currency || 'INR', category: item.category || 'Food', date: item.date || '', paidBy: item.paidBy || '', notes: item.notes || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = { ...form, amount: parseFloat(form.amount) }
    if (editingItem) {
      await syncedUpdateItem(activeTrip, 'expenses', editingItem.id, data)
    } else {
      await syncedAddItem(activeTrip, 'expenses', data)
    }
    setShowModal(false)
    setEditingItem(null)
    setForm({ ...EMPTY, currency })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-semibold text-gray-800">Expenses</h2>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="text-xs text-gray-500 border-none bg-transparent focus:outline-none mt-0.5">
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {isOwner && (
          <button onClick={openAdd}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium">
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      <div className="bg-blue-600 text-white rounded-2xl p-4 mb-4">
        <p className="text-blue-200 text-sm">Total ({currency})</p>
        <p className="text-3xl font-bold mt-1">{total.toFixed(2)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(byCat).map(([cat, amt]) => (
            <span key={cat} className="bg-blue-500 text-xs rounded-full px-2 py-0.5">
              {cat}: {amt.toFixed(2)}
            </span>
          ))}
        </div>
      </div>

      {items.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">No expenses yet.</p>
      )}

      <div className="space-y-2">
        {[...items].reverse().map(item => (
          <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">{item.title}</p>
              <p className="text-xs text-gray-400">{item.category}{item.date ? ` · ${item.date}` : ''}{item.paidBy ? ` · ${item.paidBy}` : ''}</p>
              {item.notes && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.notes}</p>}
            </div>
            <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">{item.currency} {parseFloat(item.amount).toFixed(2)}</span>
            {isOwner && (
              <button onClick={() => openEdit(item)} className="p-1.5 text-gray-300 hover:text-indigo-400 transition">
                <Pencil size={14} />
              </button>
            )}
            {isOwner && (
              <button onClick={() => syncedDeleteItem(activeTrip, 'expenses', item.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingItem(null) }} title={editingItem ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="Description *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="grid grid-cols-2 gap-3">
            <input required type="number" step="0.01" placeholder="Amount *" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Paid by" value={form.paidBy} onChange={e => setForm(f => ({ ...f, paidBy: e.target.value }))}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium">{editingItem ? 'Save Changes' : 'Add Expense'}</button>
        </form>
      </Modal>
    </div>
  )
}
