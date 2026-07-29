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

  // Build authenticated download URL
  const publicId = extractPublicId(url)
  const resourceType = extractResourceType(url)
  const format = extractFormat(url)

  const authUrl = cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'upload',
    format,
    sign_url: true,
    secure: true,
  })

  console.log('[proxy] publicId:', publicId, 'resourceType:', resourceType, 'authUrl:', authUrl)

  const upstream = await fetch(authUrl)
  console.log('[proxy] upstream status:', upstream.status)

  if (!upstream.ok) return res.status(502).json({ error: 'Failed to fetch file', status: upstream.status, url: authUrl })

  const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', 'inline')
  res.setHeader('Cache-Control', 'private, max-age=3600')

  const buffer = await upstream.arrayBuffer()
  res.send(Buffer.from(buffer))
}

function extractResourceType(url) {
  const m = url.match(/res\.cloudinary\.com\/[^/]+\/([^/]+)\/upload\//)
  return m ? m[1] : 'raw'
}

function extractPublicId(url) {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)$/)
  if (!m) return ''
  return m[1].replace(/\.[^.]+$/, '')
}

function extractFormat(url) {
  const m = url.match(/\.([^.]+)$/)
  return m ? m[1] : 'pdf'
}
