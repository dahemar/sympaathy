import fs from 'fs'
import { google } from 'googleapis'

// Updates only URL cells in selected sheets/columns by using a mapping file produced by restructure_r2_assets.mjs.
// It preserves all other data/cells exactly as-is.
//
// Usage:
// node scripts/update_sheet_urls_from_mapping.mjs /path/to/service-account.json SPREADSHEET_ID mapping.json

const SHEETS = [
  { name: 'LandingSlides', columns: ['src', 'mobile_src'] },
  { name: 'Releases', columns: ['image'] },
  { name: 'LiveGrid', columns: ['image'] },
  { name: 'LiveSlides', columns: ['src'] },
  { name: 'LiveDetails', columns: ['video_src'] }
]

const colToA1 = (colIndex0) => {
  let n = colIndex0 + 1
  let s = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    s = String.fromCharCode(65 + rem) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

const normalizeKeyFromCell = (cellValue, publicBaseUrl) => {
  const raw = String(cellValue ?? '').trim()
  if (!raw) return null

  // raw may be:
  // - full URL: https://pub...r2.dev/images%202/...
  // - path: /images%202/...
  let pathPart = raw

  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw)
      pathPart = u.pathname
    }
  } catch {
    // ignore invalid URL parse
  }

  if (publicBaseUrl && raw.startsWith(publicBaseUrl)) {
    pathPart = raw.slice(publicBaseUrl.length)
  }

  const noLeading = pathPart.replace(/^\/+/, '')
  // Decode percent-encoding to match actual object keys (R2 keys include spaces, etc)
  try {
    return decodeURIComponent(noLeading)
  } catch {
    return noLeading
  }
}

const toPublicUrl = (publicBaseUrl, key) => {
  const cleanKey = String(key || '').replace(/^\/+/, '')
  return encodeURI(`${publicBaseUrl}/${cleanKey}`)
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 3) {
    console.error('Usage: node scripts/update_sheet_urls_from_mapping.mjs <serviceAccountJson> <spreadsheetId> <mappingJson>')
    process.exit(1)
  }

  const [servicePath, spreadsheetId, mappingPath] = args
  const keyFile = JSON.parse(fs.readFileSync(servicePath, 'utf8'))
  const mappingDoc = JSON.parse(fs.readFileSync(mappingPath, 'utf8'))
  const publicBaseUrl = String(mappingDoc.publicBaseUrl || '').trim().replace(/\/+$/, '')
  const mapping = Array.isArray(mappingDoc.mapping) ? mappingDoc.mapping : []

  if (!publicBaseUrl) throw new Error('Mapping file missing publicBaseUrl')

  const fromKeyToToKey = new Map()
  for (const m of mapping) {
    if (!m?.from || !m?.to) continue
    fromKeyToToKey.set(String(m.from), String(m.to))

    // also map encoded path variant (images%202/...) to same target
    try {
      fromKeyToToKey.set(encodeURI(String(m.from)), String(m.to))
    } catch {
      // ignore
    }
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
        const cell = String(row[c.idx] ?? '').trim()
        if (!cell) continue

        const fromKey = normalizeKeyFromCell(cell, publicBaseUrl)
        if (!fromKey) continue

        const toKey = fromKeyToToKey.get(fromKey) || null
        if (!toKey) continue

        const nextUrl = toPublicUrl(publicBaseUrl, toKey)
        if (cell === nextUrl) continue

        const a1 = `${sheet.name}!${colToA1(c.idx)}${r + 1}`
        updates.push({ range: a1, values: [[nextUrl]] })
        touched++
      }
    }
  }

  if (updates.length === 0) {
    console.log('No cells matched mapping; nothing to update.')
    return
  }

  const CHUNK = 500
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK)
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: 'RAW', data: chunk }
    })
  }

  console.log(`Updated ${touched} URL cells using mapping (${mapping.length} moves).`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
