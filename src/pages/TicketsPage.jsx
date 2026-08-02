import { useState, useEffect, useRef } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { Trash2, FileText, Upload, X, Plus } from 'lucide-react'
import { subscribeSub, syncedAddItem, syncedUpdateItem, syncedDeleteItem, uploadFile, deleteFile } from '../lib/firestore'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = ['Bus', 'Hotel', 'Train', 'Flight', 'Other']

const CAT_COLORS = {
  Bus: 'bg-orange-50 text-orange-600',
  Hotel: 'bg-purple-50 text-purple-600',
  Train: 'bg-green-50 text-green-600',
  Flight: 'bg-blue-50 text-blue-600',
  Other: 'bg-gray-100 text-gray-500',
}

function pageUrl(url, page) {
  return url.replace(/\.pdf$/i, '.jpg').replace('/upload/', `/upload/pg_${page}/`)
}

export default function TicketsPage() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const { activeTrip, isOwner } = useOutletContext() || {}
  const [items, setItems] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [form, setForm] = useState({ title: '', category: 'Bus', notes: '' })
  const [expanded, setExpanded] = useState(null)
  const [titleError, setTitleError] = useState(false)
  const [addingTo, setAddingTo] = useState(null)
  const titleRef = useRef()

  useEffect(() => subscribeSub(tripId, 'tickets', setItems), [tripId])

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
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
      const uploaded = await Promise.all(files.map(f => uploadFile(user.uid, tripId, f)))
      await syncedAddItem(activeTrip, 'tickets', { ...form, files: uploaded })
      setForm({ title: '', category: 'Bus', notes: '' })
    } catch (err) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleAddFile = async (e, item) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setUploadError('')
    try {
      const uploaded = await Promise.all(files.map(f => uploadFile(user.uid, tripId, f)))
      const existing = item.files || []
      await syncedUpdateItem(activeTrip, 'tickets', item.id, { files: [...existing, ...uploaded] })
      setAddingTo(null)
    } catch (err) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (item) => {
    const files = item.files || []
    await Promise.all(files.map(f => deleteFile(f.publicId).catch(() => {})))
    if (item.publicId) await deleteFile(item.publicId).catch(() => {})
    await syncedDeleteItem(activeTrip, 'tickets', item.id)
  }

  const handleDeleteFile = async (item, fileIndex) => {
    const files = [...(item.files || [])]
    const [removed] = files.splice(fileIndex, 1)
    if (removed.publicId) await deleteFile(removed.publicId).catch(() => {})
    await syncedUpdateItem(activeTrip, 'tickets', item.id, { files })
  }

  const renderFile = (file, idx, item) => {
    const pages = file.pages || 1
    return (
      <div key={idx} className="relative mb-3">
        {(item.files || []).length > 1 && (
          <button
            onClick={() => handleDeleteFile(item, idx)}
            className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow text-gray-400 hover:text-red-400 transition"
          >
            <X size={12} />
          </button>
        )}
        {Array.from({ length: pages }, (_, i) => (
          <img
            key={i}
            src={pageUrl(file.url, i + 1)}
            alt={`${file.name} p${i + 1}`}
            className="w-full rounded-xl mb-1"
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-5">Tickets & Documents</h2>

      {isOwner && (
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
          <div className="flex flex-wrap gap-2">
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
            {uploading ? 'Uploading…' : 'Attach PDFs or images'}
            <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">No documents yet</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => {
          const files = item.files || (item.url ? [{ url: item.url, publicId: item.publicId, name: item.name, type: item.type, pages: item.pages || 1 }] : [])
          return (
            <div key={item.id} className="card overflow-hidden">
              <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${CAT_COLORS[item.category] || 'bg-gray-100 text-gray-400'}`}>
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.category} · {files.length} file{files.length !== 1 ? 's' : ''}</p>
                </div>
                {isOwner && (
                  <button onClick={e => { e.stopPropagation(); handleDelete(item) }} className="p-1.5 text-gray-300 hover:text-red-400 transition">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {expanded === item.id && (
                <div className="px-4 pb-4 pt-0">
                  <div className="h-px bg-gray-100 mb-3" />
                  {files.map((file, idx) => renderFile(file, idx, item))}
                  {item.notes && <p className="text-xs text-gray-400 mt-1">{item.notes}</p>}
                  <label className={`flex items-center justify-center gap-2 border border-dashed border-indigo-200 rounded-xl py-3 mt-2 text-xs font-medium text-indigo-400 cursor-pointer transition hover:bg-indigo-50 ${uploading && addingTo === item.id ? 'opacity-50' : ''}`}>
                    <Plus size={13} /> Add more files
                    <input type="file" accept="image/*,.pdf" multiple className="hidden"
                      onChange={e => { setAddingTo(item.id); handleAddFile(e, item) }}
                      disabled={uploading} />
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
