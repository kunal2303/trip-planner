export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url' })

  // Only allow Cloudinary URLs
  if (!url.startsWith('https://res.cloudinary.com/')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const upstream = await fetch(url)
  if (!upstream.ok) return res.status(502).json({ error: 'Failed to fetch file' })

  const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', 'inline')
  res.setHeader('Cache-Control', 'public, max-age=86400')

  const buffer = await upstream.arrayBuffer()
  res.send(Buffer.from(buffer))
}
