import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import https from 'https'

// Usage:
// AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... node scripts/r2_count_prefixes.mjs <accountId> <bucket>

const argv = process.argv.slice(2)
if (argv.length < 2) {
  console.error('Usage: node scripts/r2_count_prefixes.mjs <accountId> <bucket>')
  process.exit(1)
}

const [accountId, bucket] = argv
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
if (!accessKeyId || !secretAccessKey) {
  console.error('Missing AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY')
  process.exit(1)
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
  requestHandler: new NodeHttpHandler({
    httpsAgent: new https.Agent({ minVersion: 'TLSv1.2' })
  })
})

async function count(prefix) {
  let token
  let total = 0
  do {
    const res = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: token
    }))
    total += (res.Contents || []).length
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return total
}

console.log('images/ count:', await count('images/'))
console.log('images 2/ count:', await count('images 2/'))
console.log('assets/ count:', await count('assets/'))
