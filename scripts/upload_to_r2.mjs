import fs from 'fs'
import path from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import https from 'https'

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.mp4', '.webm', '.mov']

const argv = process.argv.slice(2)
if (argv.length < 2) {
  console.error('Usage: node scripts/upload_to_r2.mjs <accountId> <bucketName> [dir1 dir2 ...]')
  console.error('  Requires env vars: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY')
  process.exit(1)
}

const [accountId, bucketName, ...dirs] = argv
const repoRoot = process.cwd()

const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

if (!accessKeyId || !secretAccessKey) {
  console.error('Missing credentials: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY')
  process.exit(1)
}

// Cloudflare R2 S3 endpoint uses the account id: <accountId>.r2.cloudflarestorage.com
const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`
const client = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint,
  credentials: { accessKeyId, secretAccessKey },
  requestHandler: new NodeHttpHandler({
    httpsAgent: new https.Agent({ minVersion: 'TLSv1.2' })
  })
})

const walk = async (dir) => {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true })
  let files = []
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) files = files.concat(await walk(full))
    else files.push(full)
  }
  return files
}

const contentTypeFor = (ext) => {
  switch (ext.toLowerCase()) {
    case '.jpg': case '.jpeg': return 'image/jpeg'
    case '.png': return 'image/png'
    case '.webp': return 'image/webp'
    case '.gif': return 'image/gif'
    case '.svg': return 'image/svg+xml'
    case '.mp4': return 'video/mp4'
    case '.webm': return 'video/webm'
    case '.mov': return 'video/quicktime'
    default: return 'application/octet-stream'
  }
}

const normalizeKey = (filePath) => {
  // Create object key that mirrors existing sheet references like /images/... or /images 2/...
  const rel = path.relative(repoRoot, filePath).replace(/\\/g, '/')
  const idx = rel.indexOf('/images')
  if (idx !== -1) return rel.slice(idx + 1) // remove leading ./ if present
  // fallback: return rel
  return rel
}

const scanDirs = dirs.length
  ? dirs
  : [
      'images',
      'frontend/public/images',
      'frontend/public/images 2',
      'images 2'
    ]

;(async () => {
  console.log('Upload: endpoint', r2Endpoint)
  console.log('Upload: bucket', bucketName)
  console.log('Upload: scanning', scanDirs)
  const keyToFile = new Map()
  for (const d of scanDirs) {
    const full = path.join(repoRoot, d)
    if (!fs.existsSync(full)) continue
    const all = await walk(full)
    for (const f of all) {
      const ext = path.extname(f)
      if (!ALLOWED_EXT.includes(ext.toLowerCase())) continue

      const key = normalizeKey(f)
      // If multiple local paths map to the same object key, keep the first.
      if (!keyToFile.has(key)) keyToFile.set(key, f)
    }
  }

  const toUpload = Array.from(keyToFile.entries()).map(([, file]) => file)

  if (toUpload.length === 0) {
    console.log('No files found to upload')
    return
  }

  console.log('Found', toUpload.length, 'unique files to upload')

  for (const file of toUpload) {
    const key = normalizeKey(file)
    const body = await fs.promises.readFile(file)
    const ext = path.extname(file)
    const contentType = contentTypeFor(ext)
    try {
      await client.send(new PutObjectCommand({ Bucket: bucketName, Key: key, Body: body, ContentType: contentType }))
      console.log('Uploaded:', key)
    } catch (err) {
      console.error('Failed:', key, err?.message || err)
    }
  }

  console.log('Upload complete')
})().catch(err => {
  console.error(err)
  process.exit(1)
})
