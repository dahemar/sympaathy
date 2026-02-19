import fs from 'fs'
import path from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import https from 'https'

const argv = process.argv.slice(2)
if (argv.length < 2) {
  console.error('Usage: node scripts/create_r2_placeholders.mjs <accountId> <bucketName> [mappingJson]')
  process.exit(1)
}

const [accountId, bucketName, mappingPath] = argv
const mappingFile = mappingPath || path.join(process.cwd(), 'scripts', 'r2_asset_mapping.json')

const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
if (!accessKeyId || !secretAccessKey) {
  console.error('Missing AWS credentials in env: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY')
  process.exit(1)
}

const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`
const client = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint,
  credentials: { accessKeyId, secretAccessKey },
  requestHandler: new NodeHttpHandler({ httpsAgent: new https.Agent({ minVersion: 'TLSv1.2' }) })
})

const loadMappingDirs = () => {
  if (!fs.existsSync(mappingFile)) return []
  const raw = fs.readFileSync(mappingFile, 'utf8')
  try {
    const j = JSON.parse(raw)
    const entries = j.mapping || []
    const dirs = new Set()
    for (const e of entries) {
      const to = e.to || e.toUrl || e.key || ''
      if (!to) continue
      // normalize to posix and drop any leading slash
      const p = to.replace(/^\//, '')
      const dir = path.posix.dirname(p)
      if (dir && dir !== '.') dirs.add(dir)
    }
    return Array.from(dirs)
  } catch (err) {
    console.error('Failed to parse mapping JSON', err?.message || err)
    return []
  }
}

const ensurePlaceholders = async (dirs) => {
  const created = []
  for (const dir of dirs) {
    const key = dir.endsWith('/') ? `${dir}.keep` : `${dir}/.keep`
    try {
      await client.send(new PutObjectCommand({ Bucket: bucketName, Key: key, Body: '', ContentType: 'application/octet-stream' }))
      console.log('Created placeholder:', key)
      created.push(key)
    } catch (err) {
      console.error('Failed to create placeholder for', dir, err?.message || err)
    }
  }
  return created
}

;(async () => {
  console.log('R2 endpoint:', r2Endpoint)
  console.log('Bucket:', bucketName)
  const mappingDirs = loadMappingDirs()
  // Basic common folders used by project
  const common = [
    'assets',
    'assets/live',
    'assets/landing',
    'assets/releases',
    'assets/performance-frames',
    'assets/thumbnails'
  ]
  const dirsSet = new Set([...common, ...mappingDirs])
  const dirs = Array.from(dirsSet).sort()
  if (dirs.length === 0) {
    console.log('No directories to create')
    return
  }
  console.log('Will create placeholders for', dirs.length, 'directories')
  await ensurePlaceholders(dirs)
  console.log('Done')
})().catch(err => {
  console.error(err)
  process.exit(1)
})
