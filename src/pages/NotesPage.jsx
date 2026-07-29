import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { subscribeSub, addItem, updateItem, deleteItem } from '../lib/firestore'

export default function NotesPage() {
  const { tripId } = useParams()
  const [notes, setNotes] = useState([])
  const [selected, setSelected] = useState(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')

  useEffect(() => subscribeSub(tripId, 'notes', setNotes), [tripId])

  const createNote = async () => {
    const ref = await addItem(tripId, 'notes', { title: 'New note', content: '' })
    // Note: addItem returns DocumentReference
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
    updateItem(tripId, 'notes', selected.id, { title, content })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800">Notes</h2>
        <button onClick={createNote}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium">
          <Plus size={14} /> New
        </button>
      </div>

      {!selected && (
        <>
          {notes.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No notes yet.</p>
          )}
          <div className="space-y-2">
            {notes.map(note => (
              <div key={note.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3 cursor-pointer"
                onClick={() => openNote(note)}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{note.title || 'Untitled'}</p>
                  <p className="text-xs text-gray-400 truncate">{note.content || 'Empty'}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteItem(tripId, 'notes', note.id) }}
                  className="text-gray-300 hover:text-red-400 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {selected && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => { saveNote(); setSelected(null) }}
              className="text-blue-600 text-sm font-medium">← Back</button>
            <button onClick={saveNote}
              className="ml-auto bg-blue-600 text-white text-sm px-3 py-1.5 rounded-xl">Save</button>
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={saveNote}
            className="w-full text-lg font-semibold border-none focus:outline-none bg-transparent text-gray-900"
            placeholder="Note title"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onBlur={saveNote}
            className="w-full h-64 border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Write your notes here…"
          />
        </div>
      )}
    </div>
  )
}
