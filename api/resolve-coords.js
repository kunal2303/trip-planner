export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'missing url' })

  try {
    // Only follow the redirect chain to get the final URL — don't fetch the body
    // This avoids Google detecting datacenter IPs via full page fetch
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
    })
    const finalUrl = response.url

    // Try @lat,lng in final URL
    let m = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (m) return res.json({ lat: parseFloat(m[1]), lng: parseFloat(m[2]), src: 'url-at' })

    // !3d<lat>!4d<lng>
    m = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (m) return res.json({ lat: parseFloat(m[1]), lng: parseFloat(m[2]), src: 'url-3d' })

    // Return the final URL so the client can try to parse it
    return res.status(404).json({ error: 'coords not found in redirect url', finalUrl })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
