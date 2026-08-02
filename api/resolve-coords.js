const KEY = process.env.GOOGLE_MAPS_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'missing url' })

  const extractCoords = (str) => {
    let m = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
    m = str.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
    return null
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept-Language': 'en-US,en;q=0.9',
  }

  try {
    // Step 1: Follow redirect to get final URL
    const headRes = await fetch(url, { method: 'HEAD', redirect: 'follow', headers })
    const finalUrl = headRes.url

    // Step 2: Try extracting coords directly from URL
    const fromUrl = extractCoords(finalUrl)
    if (fromUrl) return res.json(fromUrl)

    // Step 3: Extract Place ID from URL (hex format 0x...:0x...)
    const placeIdMatch = finalUrl.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i)
    if (placeIdMatch && KEY) {
      const placeId = placeIdMatch[1]
      const placeRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry&key=${KEY}`
      )
      const placeData = await placeRes.json()
      const loc = placeData.result?.geometry?.location
      if (loc) return res.json({ lat: loc.lat, lng: loc.lng })
    }

    // Step 4: Extract place name and use Geocoding API
    const placeMatch = finalUrl.match(/\/maps\/place\/([^/]+)/)
    if (placeMatch && KEY) {
      let placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
      // Strip leading Plus Code (e.g. "8Q3Q+7GH ")
      placeName = placeName.replace(/^[A-Z0-9]{4,6}\+[A-Z0-9]{2,3}\s+/i, '')
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(placeName)}&key=${KEY}`
      )
      const geoData = await geoRes.json()
      const loc = geoData.results?.[0]?.geometry?.location
      if (loc) return res.json({ lat: loc.lat, lng: loc.lng })
    }

    return res.status(404).json({ error: 'coords not found', finalUrl })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
