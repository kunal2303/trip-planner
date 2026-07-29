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

const CLOUDINARY_CLOUD = 'pue4fbxb'
const CLOUDINARY_PRESET = 'trip-planner'

export async function uploadFile(_userId, _tripId, file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Cloudinary upload failed')
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
  // Cloudinary unsigned deletes require backend — skip silently
  // Files will still be accessible but orphaned; use Cloudinary dashboard to clean up
  console.info('Cloudinary file not deleted (requires signed request):', publicId)
}
