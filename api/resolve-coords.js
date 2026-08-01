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
    if (m) return res.json({ lat: parseFloat(m[1]), lng: parseFloat(m[2]) })

    // APP_INITIALIZATION_STATE pattern: <num>,<lng>,<lat>
    m = text.match(/[\d.]+,(-?\d{2,3}\.\d{5,}),(-?\d{1,2}\.\d{5,})/)
    if (m) return res.json({ lat: parseFloat(m[2]), lng: parseFloat(m[1]) })

    // !3d<lat>!4d<lng>
    m = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (m) return res.json({ lat: parseFloat(m[1]), lng: parseFloat(m[2]) })

    return res.status(404).json({ error: 'coords not found' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
