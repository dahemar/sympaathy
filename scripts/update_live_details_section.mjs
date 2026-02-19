import fs from 'fs'
import { google } from 'googleapis'

// Usage:
// node scripts/update_live_details_section.mjs /path/to/service-account.json SPREADSHEET_ID data.json
// where data.json is an array like: [{ "slug": "pastoral", "detail_header": "Header", "detail_text": "Paragraph text" }, ...]

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 3) {
    console.error('Usage: node scripts/update_live_details_section.mjs <serviceAccountJson> <spreadsheetId> <dataJson>')
    process.exit(1)
  }

  const [servicePath, spreadsheetId, dataPath] = args
  const keyFile = JSON.parse(fs.readFileSync(servicePath, 'utf8'))
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

  // Use GoogleAuth with explicit credentials (matches SHEETS_SERVICE_ACCOUNT.md)
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })

  let client
  try {
    client = await auth.getClient()
  } catch (err) {
    console.error('Failed to obtain auth client - check service account JSON and API access', err?.message || err)
    throw err
  }

  const sheets = google.sheets({ version: 'v4', auth: client })

  console.log('Using service account:', keyFile.client_email, 'project:', keyFile.project_id)

  // Read existing LiveDetails sheet
  const range = 'LiveDetails'
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range })
  const values = res.data.values || []
  if (values.length === 0) {
    throw new Error('LiveDetails sheet appears empty or missing header row')
  }

  const headers = values[0].map(h => String(h || '').trim())
  const slugIndex = headers.indexOf('slug')
  if (slugIndex === -1) throw new Error('LiveDetails sheet must have a `slug` header column')

  // Build map of existing slug -> row index (1-based including header)
  const slugRowMap = {}
  for (let i = 1; i < values.length; i++) {
    const row = values[i]
    const s = String(row[slugIndex] || '').trim()
    if (s) slugRowMap[s] = i + 1
  }

  // Ensure detail_header and detail_text columns exist, add if missing
  const ensureCols = ['detail_header', 'detail_text']
  const newHeaders = [...headers]
  let headersChanged = false
  for (const col of ensureCols) {
    if (!newHeaders.includes(col)) {
      newHeaders.push(col)
      headersChanged = true
    }
  }

  if (headersChanged) {
    // update header row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'LiveDetails!1:1',
      valueInputOption: 'RAW',
      requestBody: { values: [newHeaders] }
    })
    console.log('Added missing header columns:', ensureCols.filter(c => !headers.includes(c)))
  }

  // Refresh headers after potential update
  const headerRow = newHeaders
  const colIndex = (name) => headerRow.indexOf(name)

  // For each entry in data, upsert the row by slug
  for (const entry of data) {
    const slug = String(entry.slug || '').trim()
    if (!slug) continue

    const targetRow = slugRowMap[slug]
    const fullRow = headerRow.map(h => entry[h] ?? '')

    if (targetRow) {
      // update existing row
      const a1 = `LiveDetails!${targetRow}:${targetRow}`
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: a1,
        valueInputOption: 'RAW',
        requestBody: { values: [fullRow] }
      })
      console.log('Updated row for', slug)
    } else {
      // append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'LiveDetails',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [fullRow] }
      })
      console.log('Appended row for', slug)
    }
  }

  console.log('Done')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
