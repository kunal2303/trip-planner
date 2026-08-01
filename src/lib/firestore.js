import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, getDocs, limit,
  arrayUnion, arrayRemove,
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
  const cloudName = 'pue4fbxb'
  const uploadPreset = 'trip-planner'

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'trip-planner')

  // Always upload as image — Cloudinary converts PDFs to images automatically
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
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
    pages: data.pages || 1,
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

export async function getTripByShareToken(token) {
  const q = query(
    collection(db, 'trips'),
    where('shareToken', '==', token),
    where('isPublic', '==', true),
    limit(1),
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export function getSubCollection(tripId, sub, cb) {
  const q = query(collection(db, 'trips', tripId, sub), orderBy('createdAt', 'asc'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export async function copyTripData(fromTripId, toTripId, sections) {
  for (const sub of sections) {
    const snap = await getDocs(query(collection(db, 'trips', fromTripId, sub), orderBy('createdAt', 'asc')))
    await Promise.all(snap.docs.map(d =>
      addDoc(collection(db, 'trips', toTripId, sub), { ...d.data(), createdAt: serverTimestamp() })
    ))
  }
}

export const joinTrip = (tripId, uid) =>
  updateDoc(doc(db, 'trips', tripId), { members: arrayUnion(uid) })

export const leaveTrip = (tripId, uid) =>
  updateDoc(doc(db, 'trips', tripId), { members: arrayRemove(uid) })
