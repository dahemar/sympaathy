import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import https from 'https'
import fs from 'fs'

const argv = process.argv.slice(2)

if (argv.length < 3) {
  console.error('Usage: node scripts/restructure_r2_assets.mjs <accountId> <bucketName> <publicBaseUrl> [--apply] [--delete-old] [--out mapping.json]')
  console.error('  Requires env vars: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY')
  process.exit(1)
}

const accountId = argv[0]
const bucketName = argv[1]
const publicBaseUrl = String(argv[2] || '').trim().replace(/\/+$/, '')

const apply = argv.includes('--apply')
const deleteOld = argv.includes('--delete-old')

const outIdx = argv.indexOf('--out')
const outPath = outIdx !== -1 ? argv[outIdx + 1] : 'scripts/r2_asset_mapping.json'

const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

if (!accessKeyId || !secretAccessKey) {
  console.error('Missing credentials: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY')
  process.exit(1)
}

if (!/^https?:\/\//i.test(publicBaseUrl)) {
  console.error('publicBaseUrl must be a full URL, e.g. https://pub-xxxx.r2.dev')
  process.exit(1)
}

const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`

const client = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint,
  credentials: { accessKeyId, secretAccessKey },
  requestHandler: new NodeHttpHandler({
    httpsAgent: new https.Agent({ minVersion: 'TLSv1.2' })
  })
})

const encodeCopySourceKey = (key) => encodeURIComponent(key).replace(/%2F/g, '/')

const sanitizeSeg = (seg) => {
  const trimmed = String(seg || '').trim()
  if (!trimmed) return ''
  // keep extension if present
  const lastDot = trimmed.lastIndexOf('.')
  const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed
  const ext = lastDot > 0 ? trimmed.slice(lastDot) : ''
  const cleanedBase = base
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `${cleanedBase}${ext.toLowerCase()}`
}

const guessNewKey = (oldKey) => {
  const decoded = decodeURIComponent(oldKey)
  const key = decoded.replace(/^\/+/, '')

  // Landing
  if (key.startsWith('images/landing/')) {
    return `assets/landing/${key.slice('images/landing/'.length)}`
  }

  // Release covers (ep artwork)
  if (key.startsWith('images/') && /\bep\b/i.test(key)) {
    // images/diamantista ep.webp -> assets/releases/diamantista/diamantista-ep.webp
    const file = key.slice('images/'.length)
    const artist = file.toLowerCase().includes('diamantista')
      ? 'diamantista'
      : file.toLowerCase().includes('licitir')
        ? 'licitir'
        : file.toLowerCase().includes('pastoral')
          ? 'pastoral'
          : 'misc'
    return `assets/releases/${artist}/${sanitizeSeg(file)}`
  }

  // Live videos living under images/
  if (key.startsWith('images/') && /\.(mp4|mov|webm)$/i.test(key)) {
    const file = key.slice('images/'.length)
    const project = file.toLowerCase().includes('diamantista')
      ? 'diamantista'
      : file.toLowerCase().includes('licitir')
        ? 'licitir'
        : file.toLowerCase().includes('pastoral')
          ? 'pastoral'
          : 'misc'
    return `assets/live/${project}/${sanitizeSeg(file)}`
  }

  // Live thumbnails currently scattered
  if (key.startsWith('images/') && /\.(webp|png|jpe?g)$/i.test(key)) {
    const file = key.slice('images/'.length)
    // Special: other landing originals were handled above
    if (file.startsWith('landing/')) {
      return `assets/landing/${file.slice('landing/'.length)}`
    }
    return `assets/live/thumbnails/${sanitizeSeg(file)}`
  }

  // images 2: pastoral gallery
  if (key.startsWith('images 2/pastoral gallery/')) {
    const file = key.slice('images 2/pastoral gallery/'.length)
    return `assets/live/pastoral/gallery/${sanitizeSeg(file)}`
  }

  // images 2: performance frames
  if (key.startsWith('images 2/performance-frames/')) {
    const file = key.slice('images 2/performance-frames/'.length)
    // keep index.json as-is (sanitized filename would break references)
    if (file.toLowerCase() === 'index.json') return `assets/live/pastoral/performance-frames/index.json`
    return `assets/live/pastoral/performance-frames/${sanitizeSeg(file)}`
  }

  // images 2: updated thumbnails
  if (key.startsWith('images 2/updated thumbnails/')) {
    const file = key.slice('images 2/updated thumbnails/'.length)
    // Preserve a distinction for filenames that start with '.' (these exist in the repo)
    const dotPrefix = String(file).trim().startsWith('.') ? 'dot-' : ''
    return `assets/live/thumbnails/${dotPrefix}${sanitizeSeg(file)}`
  }

  // Default: leave as-is
  return null
}

const listAllKeys = async () => {
  let continuationToken = undefined
  const keys = []
  do {
    const res = await client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken
    }))
    const contents = res.Contents || []
    for (const obj of contents) {
      const k = obj?.Key ? String(obj.Key) : ''
      if (!k) continue
      // Only operate on the legacy prefixes we want to reorganize.
      if (k.startsWith('images/') || k.startsWith('images 2/')) keys.push(k)
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)
  return keys
}

const encodePublicUrl = (key) => {
  const k = String(key || '').replace(/^\/+/, '')
  // encodeURI keeps '/', but encodes spaces and other unsafe chars
  return encodeURI(`${publicBaseUrl}/${k}`)
}

;(async () => {
  console.log('R2 endpoint:', r2Endpoint)
  console.log('Bucket:', bucketName)

  const keys = await listAllKeys()
  console.log('Found objects:', keys.length)

  const mapping = []
  const toKeySet = new Set()

  for (const from of keys) {
    const to = guessNewKey(from)
    if (!to) continue
    if (to === from) continue

    // Avoid collisions
    if (toKeySet.has(to)) {
      console.warn('Collision: multiple sources map to same destination:', to)
      continue
    }
    toKeySet.add(to)

    mapping.push({
      from,
      to,
      fromUrl: encodePublicUrl(from),
      toUrl: encodePublicUrl(to)
    })
  }

  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    bucketName,
    accountId,
    publicBaseUrl,
    mapping
  }, null, 2))

  console.log('Planned moves:', mapping.length)
  console.log('Mapping written to:', outPath)

  if (!apply) {
    console.log('Dry run only (pass --apply to perform copy).')
    return
  }

  let copied = 0
  const copiedFrom = new Set()

  for (const m of mapping) {
    const copySource = `${bucketName}/${encodeCopySourceKey(m.from)}`
    try {
      await client.send(new CopyObjectCommand({
        Bucket: bucketName,
        Key: m.to,
        CopySource: copySource,
        MetadataDirective: 'COPY',
        ContentType: undefined
      }))
      copied++
      copiedFrom.add(m.from)
      if (copied % 50 === 0) console.log('Copied', copied, '...')
    } catch (err) {
      console.error('Copy failed:', m.from, '->', m.to, err?.message || err)
    }
  }

  console.log('Copied objects:', copied)

  if (!deleteOld) {
    console.log('Not deleting old keys (pass --delete-old to delete sources after copy).')
    return
  }

  let deleted = 0
  for (const m of mapping) {
    if (!copiedFrom.has(m.from)) continue
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: m.from }))
      deleted++
      if (deleted % 50 === 0) console.log('Deleted', deleted, '...')
    } catch (err) {
      console.error('Delete failed:', m.from, err?.message || err)
    }
  }

  console.log('Deleted old objects:', deleted)
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
