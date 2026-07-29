import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { folder } = req.body || {}

  try {
    // Generate a signed upload signature so client can upload directly to Cloudinary
    const timestamp = Math.round(Date.now() / 1000)
    const params = {
      timestamp,
      folder: folder || 'trip-planner',
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    }

    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET)

    res.status(200).json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder: params.folder,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
