export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'missing url' })

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
    })
    const text = await response.text()
    const finalUrl = response.url

    // @lat,lng in final URL
    let m = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (m) return res.json({ lat: parseFloat(m[1]), lng: parseFloat(m[2]), src: 'url' })

    // !3d<lat>!4d<lng> in page text (most reliable)
    m = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (m) return res.json({ lat: parseFloat(m[1]), lng: parseFloat(m[2]), src: '3d4d' })

    // APP_INITIALIZATION_STATE: big_number,lng,lat
    // Must be 2-3 digit lng and 1-2 digit lat (world coords)
    const allMatches = [...text.matchAll(/\d+\.\d+,(-?\d{1,3}\.\d{5,}),(-?\d{1,2}\.\d{5,})/g)]
    // Find the match where values are plausible world coordinates
    for (const match of allMatches) {
      const lng = parseFloat(match[1])
      const lat = parseFloat(match[2])
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0)) {
        return res.json({ lat, lng, src: 'init' })
      }
    }

    return res.status(404).json({ error: 'coords not found', finalUrl, snippet: text.slice(0, 200) })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
