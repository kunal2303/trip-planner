import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url' })

  if (!url.startsWith('https://res.cloudinary.com/')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Generate a signed version of the URL (valid for 1 hour)
  const signedUrl = cloudinary.utils.private_download_url(
    extractPublicId(url),
    extractFormat(url),
    { resource_type: extractResourceType(url), expires_at: Math.round(Date.now() / 1000) + 3600 }
  )

  const upstream = await fetch(signedUrl)
  if (!upstream.ok) {
    // fallback: try unsigned
    const fallback = await fetch(url)
    if (!fallback.ok) return res.status(502).json({ error: 'Failed to fetch file' })
    const ct = fallback.headers.get('content-type') || 'application/octet-stream'
    res.setHeader('Content-Type', ct)
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    const buf = await fallback.arrayBuffer()
    return res.send(Buffer.from(buf))
  }

  const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', 'inline')
  res.setHeader('Cache-Control', 'private, max-age=3600')

  const buffer = await upstream.arrayBuffer()
  res.send(Buffer.from(buffer))
}

function extractResourceType(url) {
  const m = url.match(/\/([^/]+)\/upload\//)
  return m ? m[1] : 'image'
}

function extractPublicId(url) {
  // Remove base + resource_type/upload/ + version segment, keep folder/filename without extension
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)$/)
  if (!m) return ''
  return m[1].replace(/\.[^.]+$/, '')
}

function extractFormat(url) {
  const m = url.match(/\.([^.]+)$/)
  return m ? m[1] : 'pdf'
}
