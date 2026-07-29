import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export const tripCol = (tripId, sub) => collection(db, 'trips', tripId, sub)
export const tripDoc = (tripId, sub, id) => doc(db, 'trips', tripId, sub, id)

export function subscribeSub(tripId, sub, cb) {
  const q = query(tripCol(tripId, sub), orderBy('createdAt', 'asc'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export const addItem = (tripId, sub, data) =>
  addDoc(tripCol(tripId, sub), { ...data, createdAt: serverTimestamp() })

export const updateItem = (tripId, sub, id, data) =>
  updateDoc(tripDoc(tripId, sub, id), data)

export const deleteItem = (tripId, sub, id) =>
  deleteDoc(tripDoc(tripId, sub, id))

export async function uploadFile(_userId, _tripId, file) {
  // Get signed upload params from our backend
  const sigRes = await fetch('/api/sign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'trip-planner' }),
  })
  if (!sigRes.ok) throw new Error('Failed to get upload signature')
  const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp)
  formData.append('signature', signature)
  formData.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Upload failed')
  }

  const data = await res.json()
  return {
    url: data.secure_url,
    publicId: data.public_id,
    name: file.name,
    type: file.type,
    size: file.size,
  }
}

export async function deleteFile(publicId) {
  if (!publicId) return
  await fetch('/api/delete-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId }),
  })
}
