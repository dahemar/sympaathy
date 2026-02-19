import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import https from 'https'

const argv = process.argv.slice(2)
if (argv.length < 3) {
  console.error('Usage: node scripts/add_r2_placeholder.mjs <accountId> <bucketName> <key1> [key2 ...]')
  process.exit(1)
}

const [accountId, bucketName, ...keys] = argv
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

;(async () => {
  for (const key of keys) {
    try {
      await client.send(new PutObjectCommand({ Bucket: bucketName, Key: key, Body: '', ContentType: 'application/octet-stream' }))
      console.log('Created placeholder:', key)
    } catch (err) {
      console.error('Failed to create placeholder', key, err?.message || err)
    }
  }
})().catch(err => { console.error(err); process.exit(1) })
