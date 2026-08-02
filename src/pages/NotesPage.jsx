import { useState, useEffect } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { Plus, Trash2, ChevronRight } from 'lucide-react'
import { subscribeSub, syncedAddItem, syncedUpdateItem, syncedDeleteItem } from '../lib/firestore'

export default function NotesPage() {
  const { tripId } = useParams()
  const { activeTrip } = useOutletContext() || {}
  const [notes, setNotes] = useState([])
  const [selected, setSelected] = useState(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')

  useEffect(() => subscribeSub(tripId, 'notes', setNotes), [tripId])

  const createNote = async () => {
    const ref = await syncedAddItem(activeTrip, 'notes', { title: 'New note', content: '' })
    setSelected({ id: ref.id, title: 'New note', content: '' })
    setTitle('New note')
    setContent('')
  }

  const openNote = (note) => {
    setSelected(note)
    setTitle(note.title)
    setContent(note.content || '')
  }

  const saveNote = () => {
    if (!selected) return
    syncedUpdateItem(activeTrip, 'notes', selected.id, { title, content })
  }

  function timeAgo(ts) {
    if (!ts?.seconds) return ''
    const diff = Math.floor((Date.now() / 1000) - ts.seconds)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  if (selected) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { saveNote(); setSelected(null) }}
            className="flex items-center gap-1 text-indigo-600 text-sm font-semibold">
            ← Notes
          </button>
          <button onClick={saveNote}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-medium">
            Save
          </button>
        </div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={saveNote}
          className="text-xl font-bold text-gray-900 border-none focus:outline-none bg-transparent w-full mb-3"
          placeholder="Note title"
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onBlur={saveNote}
          className="flex-1 w-full border-none focus:outline-none bg-transparent text-sm text-gray-600 leading-relaxed resize-none"
          placeholder="Start writing…"
          style={{ minHeight: '60vh' }}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-base font-bold text-gray-900">Notes</h2>
        <button onClick={createNote} className="btn-ghost border border-indigo-200">
          <Plus size={15} /> New
        </button>
      </div>

      {notes.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📝</span>
          </div>
          <p className="text-gray-500 font-medium">No notes yet</p>
          <p className="text-gray-400 text-sm mt-1">Jot down anything useful</p>
        </div>
      )}

      <div className="space-y-2">
        {notes.map(note => (
          <div key={note.id} className="card flex items-center gap-3 p-4 cursor-pointer hover:shadow-md active:scale-[0.99] transition-all"
            onClick={() => openNote(note)}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{note.title || 'Untitled'}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{note.content || 'Empty'}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-300">{timeAgo(note.createdAt)}</span>
              <button onClick={e => { e.stopPropagation(); syncedDeleteItem(activeTrip, 'notes', note.id) }}
                className="p-1.5 text-gray-300 hover:text-red-400 transition">
                <Trash2 size={14} />
              </button>
              <ChevronRight size={14} className="text-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
