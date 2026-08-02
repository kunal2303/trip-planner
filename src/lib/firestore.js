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

// Fan-out helper: writes to all member trip copies for shared sections
async function fanOut(trip, sub, fn) {
  const shared = trip.sharedSections || []
  if (!shared.includes(sub)) return
  const memberTripIds = Object.values(trip.memberTripIds || {})
  if (!memberTripIds.length) return
  await Promise.all(memberTripIds.map(fn))
}

export const syncedAddItem = async (trip, sub, data) => {
  if (!trip) return
  const ref = await addItem(trip.id, sub, data)
  await fanOut(trip, sub, memberTripId =>
    addDoc(tripCol(memberTripId, sub), { ...data, createdAt: serverTimestamp(), _syncedId: ref.id })
  )
  return ref
}

export const syncedUpdateItem = async (trip, sub, id, data) => {
  if (!trip) return updateItem(trip?.id, sub, id, data)
  await updateItem(trip.id, sub, id, data)
  await fanOut(trip, sub, async memberTripId => {
    const snap = await getDocs(query(tripCol(memberTripId, sub), where('_syncedId', '==', id)))
    await Promise.all(snap.docs.map(d => updateDoc(d.ref, data)))
  })
}

export const syncedDeleteItem = async (trip, sub, id) => {
  if (!trip) return
  await deleteItem(trip.id, sub, id)
  await fanOut(trip, sub, async memberTripId => {
    const snap = await getDocs(query(tripCol(memberTripId, sub), where('_syncedId', '==', id)))
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
  })
}

export async function createMemberTrip(ownerTrip, memberUid, sharedSections) {
  if (ownerTrip.uid === memberUid) throw new Error('You already own this trip.')
  // Create a new trip doc owned by the member
  const { uid, id: _id, shareToken, isPublic, members, memberTripIds, sharedSections: _, originTripId: _oid, ...tripFields } = ownerTrip
  const memberTripRef = await addDoc(collection(db, 'trips'), {
    ...tripFields,
    uid: memberUid,
    originTripId: ownerTrip.id,
    createdAt: serverTimestamp(),
  })
  const memberTripId = memberTripRef.id

  // Copy shared subcollections with _syncedId linking back to owner's item
  const subs = sharedSections?.length ? sharedSections : []
  for (const sub of subs) {
    const snap = await getDocs(query(tripCol(ownerTrip.id, sub), orderBy('createdAt', 'asc')))
    await Promise.all(snap.docs.map(d =>
      addDoc(tripCol(memberTripId, sub), { ...d.data(), _syncedId: d.id, createdAt: serverTimestamp() })
    ))
  }

  // Register member on owner's trip (best-effort — member trip already created)
  try {
    await updateDoc(doc(db, 'trips', ownerTrip.id), {
      members: arrayUnion(memberUid),
      [`memberTripIds.${memberUid}`]: memberTripId,
    })
  } catch (e) {
    console.warn('Could not update owner trip with member info:', e.message)
  }

  return memberTripId
}

// When owner changes sharedSections, wipe removed sections from all member copies
export async function syncSharedSections(trip, newSections) {
  const prev = trip.sharedSections || []
  const removed = prev.filter(s => !newSections.includes(s))
  const memberTripIds = Object.values(trip.memberTripIds || {}).filter(Boolean)
  if (!removed.length || !memberTripIds.length) return
  await Promise.all(
    memberTripIds.flatMap(memberTripId =>
      removed.map(async sub => {
        const snap = await getDocs(tripCol(memberTripId, sub))
        await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
      })
    )
  )
}

export const leaveTrip = async (ownerTripId, memberUid) => {
  try {
    await updateDoc(doc(db, 'trips', ownerTripId), {
      members: arrayRemove(memberUid),
      [`memberTripIds.${memberUid}`]: null,
    })
  } catch (e) {
    console.error('leaveTrip failed:', e.message)
    throw e
  }
}

export async function uploadFile(_userId, _tripId, file) {
  const cloudName = 'pue4fbxb'
  const uploadPreset = 'trip-planner'

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'trip-planner')

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
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => cb([]))
}
