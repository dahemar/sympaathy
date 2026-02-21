import fs from 'fs'
import { google } from 'googleapis'

// Updates only asset URL cells in specific sheets by prefixing local paths with a public base URL.
// Does NOT modify any other cells.
//
// Usage:
// node scripts/replace_sheet_asset_urls.mjs /path/to/service-account.json SPREADSHEET_ID https://pub-xxxx.r2.dev

const ASSET_PATH_RE = /^(\/images|\/images%202|\/videos|\/video|\/assets)/i

const SHEETS = [
  { name: 'LandingSlides', columns: ['src', 'mobile_src'] },
  { name: 'Releases', columns: ['image'] },
  { name: 'LiveGrid', columns: ['image'] },
  { name: 'LiveSlides', columns: ['src'] },
  { name: 'LiveDetails', columns: ['video_src'] }
]

const colToA1 = (colIndex0) => {
  // 0 -> A
  let n = colIndex0 + 1
  let s = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    s = String.fromCharCode(65 + rem) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 3) {
    console.error('Usage: node scripts/replace_sheet_asset_urls.mjs <serviceAccountJson> <spreadsheetId> <publicBaseUrl>')
    process.exit(1)
  }

  const [servicePath, spreadsheetId, publicBaseUrlRaw] = args
  const keyFile = JSON.parse(fs.readFileSync(servicePath, 'utf8'))
  const publicBaseUrl = String(publicBaseUrlRaw || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(publicBaseUrl)) {
    throw new Error('publicBaseUrl must be a full URL, e.g. https://pub-xxxx.r2.dev')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })
  const client = await auth.getClient()
  const sheets = google.sheets({ version: 'v4', auth: client })

  const updates = []
  let touched = 0

  for (const sheet of SHEETS) {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: sheet.name })
    const values = res.data.values || []
    if (values.length === 0) continue

    const headers = (values[0] || []).map(h => String(h || '').trim())
    const colIndexes = sheet.columns
      .map(c => ({ name: c, idx: headers.indexOf(c) }))
      .filter(x => x.idx !== -1)

    if (colIndexes.length === 0) continue

    for (let r = 1; r < values.length; r++) {
      const row = values[r] || []
      for (const c of colIndexes) {
        const raw = String(row[c.idx] ?? '').trim()
        if (!raw) continue
        if (!ASSET_PATH_RE.test(raw)) continue
        if (raw.startsWith(publicBaseUrl)) continue

        const next = `${publicBaseUrl}${raw.startsWith('/') ? '' : '/'}${raw}`

        const a1 = `${sheet.name}!${colToA1(c.idx)}${r + 1}`
        updates.push({ range: a1, values: [[next]] })
        touched++
      }
    }
  }

  if (updates.length === 0) {
    console.log('No asset URLs to update')
    return
  }

  // Batch updates in chunks (API limit safety)
  const CHUNK = 500
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK)
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: chunk
      }
    })
  }

  console.log(`Updated ${touched} cells with public base URL: ${publicBaseUrl}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
