import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Trash2, FileText, Download, Upload } from 'lucide-react'
import { subscribeSub, addItem, deleteItem, uploadFile, deleteFile } from '../lib/firestore'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = ['Bus','Flight', 'Hotel', 'Train', 'Car', 'Ferry', 'Activity', 'Visa', 'Insurance', 'Other']

const CAT_COLORS = {
  Flight: 'bg-blue-50 text-blue-600',
  Hotel: 'bg-purple-50 text-purple-600',
  Train: 'bg-green-50 text-green-600',
  Car: 'bg-orange-50 text-orange-600',
  Ferry: 'bg-cyan-50 text-cyan-600',
  Activity: 'bg-pink-50 text-pink-600',
  Visa: 'bg-red-50 text-red-600',
  Insurance: 'bg-teal-50 text-teal-600',
  Other: 'bg-gray-100 text-gray-500',
}

export default function TicketsPage() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [form, setForm] = useState({ title: '', category: 'Bus', notes: '' })
  const [expanded, setExpanded] = useState(null)
  const [titleError, setTitleError] = useState(false)
  const titleRef = useRef()

  useEffect(() => subscribeSub(tripId, 'tickets', setItems), [tripId])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!form.title.trim()) {
      setTitleError(true)
      titleRef.current?.focus()
      setTimeout(() => setTitleError(false), 1500)
      e.target.value = ''
      return
    }
    setUploading(true)
    setUploadError('')
    try {
      const fileData = await uploadFile(user.uid, tripId, file)
      await addItem(tripId, 'tickets', { ...form, ...fileData })
      setForm({ title: '', category: 'Bus', notes: '' })
    } catch (err) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (item) => {
    if (item.path) await deleteFile(item.path).catch(() => {})
    await deleteItem(tripId, 'tickets', item.id)
  }

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-5">Tickets & Documents</h2>

      {/* Upload form */}
      <div className="card p-4 mb-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add Document</p>
        <input
          ref={titleRef}
          placeholder="Document title *"
          value={form.title}
          onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setTitleError(false) }}
          className={`field transition ${titleError ? 'ring-2 ring-red-400 border-red-300 placeholder-red-400' : ''}`}
        />
        {titleError && <p className="text-xs text-red-500 -mt-1">Enter a title before attaching a file</p>}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition ${
                form.category === c ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
              {c}
            </button>
          ))}
        </div>
        <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-4 text-sm font-medium cursor-pointer transition ${
          uploading ? 'border-indigo-300 bg-indigo-50 text-indigo-500' : 'border-indigo-300 text-indigo-500 hover:bg-indigo-50'
        }`}>
          <Upload size={16} />
          {uploading ? 'Uploading…' : 'Attach PDF or image'}
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
        {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">No documents yet</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="card overflow-hidden">
            <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${CAT_COLORS[item.category] || 'bg-gray-100 text-gray-400'}`}>
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-gray-400">{item.category}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); handleDelete(item) }} className="p-1.5 text-gray-300 hover:text-red-400 transition">
                <Trash2 size={14} />
              </button>
            </div>
            {expanded === item.id && item.url && (
              <div className="px-4 pb-4 pt-0">
                <div className="h-px bg-gray-100 mb-3" />
                {item.type?.startsWith('image/') ? (
                  <a href={item.url} target="_blank" rel="noreferrer" className="block">
                    <img src={item.url} alt={item.name} className="w-full rounded-xl" />
                  </a>
                ) : (
                  <a
                    href={item.url}
                    target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-10 bg-gray-50 rounded-xl text-sm text-indigo-500 font-medium border border-gray-100"
                  >
                    <FileText size={16} /> View PDF
                  </a>
                )}
                <a href={item.url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 mt-3 text-xs text-indigo-500 font-medium">
                  <Download size={12} /> Download / Open
                </a>
                {item.notes && <p className="text-xs text-gray-400 mt-2">{item.notes}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
