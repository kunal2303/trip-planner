import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, FileText, Download } from 'lucide-react'
import { subscribeSub, addItem, deleteItem, uploadFile, deleteFile } from '../lib/firestore'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = ['Flight', 'Hotel', 'Train', 'Car', 'Ferry', 'Activity', 'Visa', 'Insurance', 'Other']

export default function TicketsPage() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Flight', notes: '' })
  const [expanded, setExpanded] = useState(null)

  useEffect(() => subscribeSub(tripId, 'tickets', setItems), [tripId])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !form.title.trim()) return
    setUploading(true)
    const fileData = await uploadFile(user.uid, tripId, file)
    await addItem(tripId, 'tickets', { ...form, ...fileData })
    setUploading(false)
    setForm({ title: '', category: 'Flight', notes: '' })
    e.target.value = ''
  }

  const handleDelete = async (item) => {
    if (item.path) await deleteFile(item.path).catch(() => {})
    await deleteItem(tripId, 'tickets', item.id)
  }

  return (
    <div>
      <h2 className="font-semibold text-gray-800 mb-4">Tickets & Documents</h2>

      {/* Upload form */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 space-y-3">
        <input
          placeholder="Document title *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <label className={`block w-full text-center border-2 border-dashed ${uploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300'} rounded-xl py-3 text-sm text-gray-500 cursor-pointer hover:border-blue-400`}>
          {uploading ? 'Uploading…' : '📎 Tap to attach file (PDF, image)'}
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={!form.title.trim() || uploading} />
        </label>
      </div>

      {items.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">No documents yet.</p>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div
              className="flex items-center gap-3 p-3 cursor-pointer"
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
            >
              <FileText size={18} className="text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-gray-400">{item.category}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); handleDelete(item) }} className="text-gray-300 hover:text-red-400 p-1">
                <Trash2 size={14} />
              </button>
            </div>
            {expanded === item.id && item.url && (
              <div className="px-3 pb-3">
                {item.type?.startsWith('image/') ? (
                  <img src={item.url} alt={item.name} className="w-full rounded-lg" />
                ) : (
                  <a href={item.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 text-sm px-3 py-2 rounded-lg">
                    <Download size={14} /> Open / Download PDF
                  </a>
                )}
                {item.notes && <p className="text-xs text-gray-500 mt-2">{item.notes}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
