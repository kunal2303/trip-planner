const KEY = process.env.GOOGLE_MAPS_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { olat, olng, dlat, dlng } = req.query
  if (!olat || !olng || !dlat || !dlng) return res.status(400).json({ error: 'missing params' })
  if (!KEY) return res.status(500).json({ error: 'no api key' })

  try {
    const r = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': KEY,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: parseFloat(olat), longitude: parseFloat(olng) } } },
        destination: { location: { latLng: { latitude: parseFloat(dlat), longitude: parseFloat(dlng) } } },
        travelMode: 'DRIVE',
      }),
    })
    const data = await r.json()
    const route = data.routes?.[0]
    if (!route) return res.status(404).json({ error: 'no route found' })

    const meters = route.distanceMeters
    const seconds = parseInt(route.duration)
    const dist = meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
    const mins = Math.round(seconds / 60)
    const time = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`

    return res.json({ distance: dist, duration: time })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
