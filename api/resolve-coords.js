export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'missing url' })

  try {
    // Follow redirects (HEAD only — avoids Google serving datacenter content)
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
    })
    const finalUrl = response.url

    // Try @lat,lng in final URL
    let m = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (m) return res.json({ lat: parseFloat(m[1]), lng: parseFloat(m[2]) })

    // Try !3d<lat>!4d<lng>
    m = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (m) return res.json({ lat: parseFloat(m[1]), lng: parseFloat(m[2]) })

    // Extract place name from /maps/place/<name>/
    const placeMatch = finalUrl.match(/\/maps\/place\/([^/?]+)/)
    if (placeMatch) {
      const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'TripPlanner/1.0 (trip-planner-seven-orpin.vercel.app)' } }
      )
      const geoData = await geoRes.json()
      if (geoData[0]) {
        return res.json({ lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) })
      }
    }

    return res.status(404).json({ error: 'coords not found', finalUrl })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
