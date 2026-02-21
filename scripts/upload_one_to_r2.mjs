import fs from 'fs'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import https from 'https'

const argv = process.argv.slice(2)
if (argv.length < 4) {
  console.error('Usage: node scripts/upload_one_to_r2.mjs <localFile> <destKey> <accountId> <bucketName>')
  process.exit(1)
}

const [localFile, destKey, accountId, bucketName] = argv
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
if (!accessKeyId || !secretAccessKey) {
  console.error('Missing AWS credentials in env (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY)')
  process.exit(1)
}

const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`
const client = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint,
  credentials: { accessKeyId, secretAccessKey },
  requestHandler: new NodeHttpHandler({ httpsAgent: new https.Agent({ minVersion: 'TLSv1.2' }) })
})

const contentTypeFor = (ext) => {
  switch (ext.toLowerCase()) {
    case '.mp4': return 'video/mp4'
    case '.webm': return 'video/webm'
    case '.mov': return 'video/quicktime'
    case '.jpg': case '.jpeg': return 'image/jpeg'
    case '.png': return 'image/png'
    case '.webp': return 'image/webp'
    default: return 'application/octet-stream'
  }
}

(async () => {
  if (!fs.existsSync(localFile)) {
    console.error('Local file not found:', localFile)
    process.exit(1)
  }
  const body = await fs.promises.readFile(localFile)
  const ext = localFile.includes('.') ? '.' + localFile.split('.').pop() : ''
  const ContentType = contentTypeFor(ext)
  try {
    await client.send(new PutObjectCommand({ Bucket: bucketName, Key: destKey, Body: body, ContentType }))
    console.log('Uploaded to', `${r2Endpoint.replace('.r2.cloudflarestorage.com','')}.r2 -> ${bucketName}/${destKey}`)
    console.log('Public URL: ', `https://pub-968c4f8cd5bc4dadb4ec1aa19cf615a2.r2.dev/${encodeURI(destKey)}`)
  } catch (err) {
    console.error('Upload failed:', err?.message || err)
    process.exit(1)
  }
})().catch(err => { console.error(err); process.exit(1) })
