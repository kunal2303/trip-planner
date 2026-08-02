import { createContext, useContext, useEffect, useState } from 'react'
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const TripContext = createContext(null)

export function TripProvider({ children }) {
  const { user } = useAuth()
  const [trips, setTrips] = useState([])
  const [activeTrip, setActiveTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { setTrips([]); setLoading(false); return }

    const q = query(collection(db, 'trips'), where('uid', '==', user.uid))
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setTrips(all.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')))
      setLoading(false)
    }, err => { console.error('trips query error:', err.message); setError(err.message); setLoading(false) })
  }, [user])

  const createTrip = (data) =>
    addDoc(collection(db, 'trips'), { ...data, uid: user.uid, members: [], createdAt: serverTimestamp() })

  const updateTrip = (id, data) => updateDoc(doc(db, 'trips', id), data)
  const deleteTrip = (id) => deleteDoc(doc(db, 'trips', id))
  return (
    <TripContext.Provider value={{ trips, activeTrip, setActiveTrip, loading, error, createTrip, updateTrip, deleteTrip }}>
      {children}
    </TripContext.Provider>
  )
}

export const useTrips = () => useContext(TripContext)
