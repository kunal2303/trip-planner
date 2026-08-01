export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'missing url' })

  try {
    // Follow redirects to get the full Google Maps URL
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const text = await response.text()
    const finalUrl = response.url

    // Try @lat,lng in the final URL
    let m = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (m) return res.json({ lat: parseFloat(m[1]), lng: parseFloat(m[2]) })

    // Try !3d<lat>!4d<lng> in the final URL
    m = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (m) return res.json({ lat: parseFloat(m[1]), lng: parseFloat(m[2]) })

    // Extract from APP_INITIALIZATION_STATE in page HTML
    // Format: [[[..., lng, lat], ...
    m = text.match(/APP_INITIALIZATION_STATE=\[\[\[[\d.]+,([\d.]+),([\d.]+)\]/)
    if (m) return res.json({ lat: parseFloat(m[2]), lng: parseFloat(m[1]) })

    // Try extracting coords from page meta
    m = text.match(/"(-?\d{1,3}\.\d{4,}),(-?\d{1,3}\.\d{4,})"/)
    if (m) return res.json({ lat: parseFloat(m[1]), lng: parseFloat(m[2]) })

    return res.status(404).json({ error: 'coords not found' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
