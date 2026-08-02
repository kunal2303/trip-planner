export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'missing url' })

  const headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept-Language': 'en-US,en;q=0.9',
  }

  const extractCoords = (str) => {
    let m = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
    m = str.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
    return null
  }

  try {
    // HEAD first — fast path for full URLs already containing coords
    const headRes = await fetch(url, { method: 'HEAD', redirect: 'follow', headers })
    const coords = extractCoords(headRes.url)
    if (coords) return res.json(coords)

    // GET — needed for short URLs (maps.app.goo.gl) where HEAD doesn't reveal coords
    const getRes = await fetch(url, { method: 'GET', redirect: 'follow', headers })
    const finalUrl = getRes.url
    const fromUrl = extractCoords(finalUrl)
    if (fromUrl) return res.json(fromUrl)

    // Search response body for coords
    const body = await getRes.text()
    const fromBody = extractCoords(body)
    if (fromBody) return res.json(fromBody)

    // Fall back to place name geocoding via Photon (OpenStreetMap)
    const placeMatch = finalUrl.match(/\/maps\/place\/([^/]+)/)
    if (placeMatch) {
      let placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
      // Strip leading Plus Code (e.g. "8Q3Q+7GH ")
      placeName = placeName.replace(/^[A-Z0-9]{4,6}\+[A-Z0-9]{2,3}\s+/i, '')
      // Try progressively shorter queries (full name, then just before first comma)
      const queries = [placeName, placeName.split(',')[0].trim()]
      for (const q of queries) {
        const geoRes = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`,
          { headers: { 'User-Agent': 'TripPlanner/1.0' } }
        )
        const geoData = await geoRes.json()
        const coords = geoData.features?.[0]?.geometry?.coordinates
        if (coords) return res.json({ lat: coords[1], lng: coords[0] })
      }
    }

    return res.status(404).json({ error: 'coords not found', finalUrl })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
