const SHEETS_BATCH_ENDPOINT = 'https://sheets.googleapis.com/v4/spreadsheets/1Zfp7ZajmFph1zqA2K_jK_5Jgf_L-EyuxRkpMpEmKerg/values:batchGet?key=AIzaSyBHQgbSv588A3qr-Kzeo6YrZ9TbVNlrSkc&ranges=LiveDetails'

;(async () => {
  try {
    const res = await fetch(SHEETS_BATCH_ENDPOINT)
    if (!res.ok) {
      console.error('fetch failed', res.status)
      process.exit(1)
    }
    const data = await res.json()
    const vr = (data.valueRanges || [])[0]
    const rows = vr.values || []
    const headers = (rows[0] || []).map(h => String(h || '').trim())
    const parsed = rows.slice(1).map(r => {
      const e = {}
      headers.forEach((h, idx) => { e[h] = r[idx] || '' })
      return e
    })
    const find = parsed.find(p => p.slug === 'diamantista-live')
    console.log('found row:', !!find)
    console.log(find)
    const infer = (row) => {
      const videoSrc = String(row.video_src || '').trim()
      if (!videoSrc) return null
      const explicitType = String(row.video_type || '').trim().toLowerCase()
      if (explicitType && explicitType !== 'none') return { type: explicitType, src: videoSrc }
      const lower = videoSrc.toLowerCase()
      const isLocalVideo = /\.(mp4|mov|webm|ogg)(\?.*)?$/.test(lower) || lower.startsWith('/images/') || lower.startsWith('/videos/') || lower.startsWith('/')
      const isIframe = /youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com/.test(lower)
      if (isIframe) return { type: 'iframe', src: videoSrc }
      if (isLocalVideo) return { type: 'video', src: videoSrc }
      return null
    }
    console.log('inferred video:', infer(find))
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
