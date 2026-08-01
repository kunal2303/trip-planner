import { createContext, useContext, useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
import { joinTrip, leaveTrip } from '../lib/firestore'

const TripContext = createContext(null)

export function TripProvider({ children }) {
  const { user } = useAuth()
  const [trips, setTrips] = useState([])
  const [activeTrip, setActiveTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { setTrips([]); setLoading(false); return }

    let owned = [], joined = []
    const merge = () => {
      const all = [...owned, ...joined]
      const deduped = [...new Map(all.map(t => [t.id, t])).values()]
      setTrips(deduped.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')))
      setLoading(false)
    }

    const q1 = query(collection(db, 'trips'), where('uid', '==', user.uid))
    const q2 = query(collection(db, 'trips'), where('members', 'array-contains', user.uid))

    const u1 = onSnapshot(q1, snap => {
      owned = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      merge()
    }, err => { setError(err.message); setLoading(false) })

    const u2 = onSnapshot(q2, snap => {
      joined = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      merge()
    }, err => { setError(err.message); setLoading(false) })

    return () => { u1(); u2() }
  }, [user])

  const createTrip = (data) =>
    addDoc(collection(db, 'trips'), { ...data, uid: user.uid, members: [], createdAt: serverTimestamp() })

  const updateTrip = (id, data) => updateDoc(doc(db, 'trips', id), data)
  const deleteTrip = (id) => deleteDoc(doc(db, 'trips', id))
  const joinTripForUser = (tripId) => joinTrip(tripId, user.uid)
  const leaveTripForUser = (tripId) => leaveTrip(tripId, user.uid)

  return (
    <TripContext.Provider value={{ trips, activeTrip, setActiveTrip, loading, error, createTrip, updateTrip, deleteTrip, joinTripForUser, leaveTripForUser }}>
      {children}
    </TripContext.Provider>
  )
}

export const useTrips = () => useContext(TripContext)
