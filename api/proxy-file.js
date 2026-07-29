export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url' })

  if (!url.startsWith('https://res.cloudinary.com/')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

  const upstream = await fetch(url, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  })

  console.log('[proxy] status:', upstream.status, 'url:', url)

  if (!upstream.ok) return res.status(502).json({ error: 'Failed to fetch file', status: upstream.status })

  const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', 'inline')
  res.setHeader('Cache-Control', 'private, max-age=3600')

  const buffer = await upstream.arrayBuffer()
  res.send(Buffer.from(buffer))
}
