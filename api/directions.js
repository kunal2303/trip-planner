const KEY = process.env.GOOGLE_MAPS_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { olat, olng, dlat, dlng } = req.query
  if (!olat || !olng || !dlat || !dlng) return res.status(400).json({ error: 'missing params' })
  if (!KEY) return res.status(500).json({ error: 'no api key' })

  try {
    const r = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${olat},${olng}&destination=${dlat},${dlng}&mode=driving&key=${KEY}`
    )
    const data = await r.json()
    const leg = data.routes?.[0]?.legs?.[0]
    if (!leg) return res.status(404).json({ error: 'no route found' })
    return res.json({
      distance: leg.distance.text,
      duration: leg.duration.text,
    })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
