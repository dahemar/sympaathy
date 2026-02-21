import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import { Routes, Route, Link, useParams, useLocation } from 'react-router-dom'
import { ScrambleText } from './components/ScrambleText.jsx'
import { MediaSlider } from './components/MediaSlider.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'

const SHEETS_API_KEY = import.meta.env.VITE_SHEETS_API_KEY || 'AIzaSyBHQgbSv588A3qr-Kzeo6YrZ9TbVNlrSkc'
const SHEET_ID = import.meta.env.VITE_SHEET_ID || '1Zfp7ZajmFph1zqA2K_jK_5Jgf_L-EyuxRkpMpEmKerg'

const SHEETS_ENDPOINT = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`
const SHEETS_BATCH_ENDPOINT = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchGet`

const DEBUG_SHEETS =
  import.meta.env.VITE_DEBUG_SHEETS != null
    ? String(import.meta.env.VITE_DEBUG_SHEETS).toLowerCase() === 'true'
    : import.meta.env.DEV

const debugLog = (...args) => {
  if (!DEBUG_SHEETS) return
  // eslint-disable-next-line no-console
  console.log('[sheets]', ...args)
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const getCachedSheetEntry = (sheetName) => {
  try {
    const cached = sessionStorage.getItem(`sheets_${sheetName}`)
    if (!cached) return null
    const { data, timestamp } = JSON.parse(cached)
    if (!Array.isArray(data) || typeof timestamp !== 'number') return null
    return { data, timestamp }
  } catch {
    return null
  }
}

const getCachedSheetFresh = (sheetName) => {
  const entry = getCachedSheetEntry(sheetName)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) return null
  return entry.data
}

const getCachedSheetAny = (sheetName) => {
  const entry = getCachedSheetEntry(sheetName)
  return entry?.data || null
}

const setCachedSheet = (sheetName, data) => {
  try {
    sessionStorage.setItem(`sheets_${sheetName}`, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    // ignore quota errors
  }
}

const parseSheetValues = (sheetName, rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return []
  const headers = (rows[0] || []).map(h => String(h || '').trim())
  const parsed = rows.slice(1).map(row => {
    const entry = {}
    headers.forEach((h, idx) => {
      entry[h] = row?.[idx] ?? ''
    })
    return entry
  })
  debugLog('parsed', sheetName, { headers, rowCount: parsed.length })
  return parsed
}

const fetchSheetsBatch = async (sheetNames) => {
  const params = new URLSearchParams({ key: SHEETS_API_KEY })
  sheetNames.forEach((name) => params.append('ranges', name))
  const url = `${SHEETS_BATCH_ENDPOINT}?${params.toString()}`
  debugLog('batch fetch', url)
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch sheets batch')
  const data = await res.json()
  const ranges = data.valueRanges || []
  const out = {}
  for (const vr of ranges) {
    const rangeName = String(vr.range || '').split('!')[0]
    if (!rangeName) continue
    out[rangeName] = parseSheetValues(rangeName, vr.values || [])
  }
  return out
}

const parseNumber = (val, fallback = 0) => {
  const n = Number(val)
  return Number.isFinite(n) ? n : fallback
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const inferVideo = (row) => {
  const videoSrc = String(row.video_src || '').trim()
  if (!videoSrc) return null

  // Backward compatible: if video_type exists, respect it.
  const explicitType = String(row.video_type || '').trim().toLowerCase()
  if (explicitType && explicitType !== 'none') {
    return { type: explicitType, src: videoSrc, title: row.video_title || row.title }
  }

  // Infer type from URL / extension
  const lower = videoSrc.toLowerCase()
  const isLocalVideo = /\.(mp4|mov|webm|ogg|mpg|mpeg)(\?.*)?$/.test(lower) || lower.startsWith('/images/') || lower.startsWith('/videos/') || lower.startsWith('/')
  const isIframe = /youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com/.test(lower)

  if (isIframe) return { type: 'iframe', src: videoSrc, title: row.video_title || row.title }
  if (isLocalVideo) return { type: 'video', src: videoSrc, title: row.video_title || row.title }

  return null
}

const Layout = memo(({ children }) => {
  const [showBackToTop, setShowBackToTop] = useState(false)
  const location = useLocation()
  const isLanding = location?.pathname === '/'

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setShowBackToTop(window.scrollY > 120)
      } else {
        setShowBackToTop(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Landing page: lock scroll and avoid horizontal overflow in iOS
    const html = document.documentElement
    const body = document.body
    if (isLanding) {
      html.classList.add('page-landing')
      body.classList.add('page-landing')
    } else {
      html.classList.remove('page-landing')
      body.classList.remove('page-landing')
    }
  }, [isLanding])

  useEffect(() => {
    const scrollHandler = () => {
      const isMobile = window.innerWidth <= 768
      const hasScrolled = window.scrollY > 120

      if (isMobile) {
        setShowBackToTop(hasScrolled)
      } else {
        setShowBackToTop(false)
      }
    }

    scrollHandler()

    window.addEventListener('scroll', scrollHandler, { passive: true })

    return () => {
      window.removeEventListener('scroll', scrollHandler)
    }
  }, [])

  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.documentElement.style.scrollBehavior = 'smooth'
    } else {
      document.documentElement.style.scrollBehavior = 'auto'
    }

    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  const scrollToTop = useCallback(() => {
    if (window.innerWidth <= 768) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      })
    } else {
      window.scrollTo(0, 0)
    }
  }, [])

  return (
    <>
      <nav className="main-nav">
        <div className="main-nav-left">
          <Link to="/" className="scramble"></Link>
      </div>
        <div className="main-nav-right">
          <Link to="/releases">
            <ScrambleText delay={0}>releases</ScrambleText>
          </Link>
          <Link to="/live">
            <ScrambleText delay={100}>live</ScrambleText>
          </Link>
          <Link to="/bio">
            <ScrambleText delay={200}>bio</ScrambleText>
          </Link>
          <Link to="/contact">
            <ScrambleText delay={300}>contact</ScrambleText>
          </Link>
      </div>
      </nav>
      <div className={`page-content${isLanding ? ' is-landing' : ''}`}>
        {children}
      </div>
      {showBackToTop && (
        <button id="backToTop" onClick={scrollToTop}>
          ↑ back to top
        </button>
      )}
    </>
  )
})

Layout.displayName = 'Layout'

const parseRichText = (paragraph) => {
  // Supports link tokens: [[Text|https://...]] and line breaks via [BR]
  const tokens = paragraph.split(/(\[\[.+?\|https?:\/\/[^\]]+\]\]|\[BR\])/g)
  return tokens.map((token, idx) => {
    if (token === '[BR]') {
      return <br key={`br-${idx}`} />
    }
    const linkMatch = token.match(/^\[\[(.+?)\|(https?:\/\/[^\]]+)\]\]$/)
    if (linkMatch) {
      const [, text, href] = linkMatch
      return (
        <a
          key={`ln-${idx}`}
          href={href}
          className="contact-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {text}
        </a>
      )
    }
    return <span key={`t-${idx}`}>{token}</span>
  })
}

const splitLines = (text = '') => {
  // Split on real newlines or escaped \n from Sheets/CSV
  return text.split(/(?:\r?\n|\\n)/)
}

const Landing = memo(({ slides }) => {
  const hasSlides = slides && slides.length > 0
  useEffect(() => {
    debugLog('Landing slides', { count: slides?.length || 0, slides })
  }, [slides])
  return (
    <div className="landing-hero">
      {hasSlides ? (
        <MediaSlider images={slides} intervalMs={6000} alt="landing slideshow" showNavigation />
      ) : null}
    </div>
  )
})

Landing.displayName = 'Landing'

const Releases = memo(({ releases }) => {
  const [loadedByKey, setLoadedByKey] = useState(() => ({}))

  const markLoaded = useCallback((key) => {
    if (!key) return
    setLoadedByKey((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
  }, [])

  return (
    <div className="releases-page">
      <div className="projects-grid releases-grid">
        {releases.map(({ href, title, image }, index) => (
          // Render caption only after the image has loaded (prevents text-before-image flashes on mobile)
          <a
            key={href || `${title}-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="release-card"
          >
            <picture>
              <img 
                src={image} 
                alt={title} 
                loading={index < 4 ? "eager" : "lazy"}
                fetchPriority={index < 2 ? "high" : "auto"}
                onLoad={() => markLoaded(href)}
                onError={() => markLoaded(href)}
              />
            </picture>
            {loadedByKey[href] ? <div className="project-caption">{title}</div> : null}
          </a>
        ))}
      </div>
    </div>
  )
})

Releases.displayName = 'Releases'

const Live = memo(({ liveProjects }) => {
  const [loadedByKey, setLoadedByKey] = useState(() => ({}))

  const markLoaded = useCallback((key) => {
    if (!key) return
    setLoadedByKey((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
  }, [])

  const resolveClass = useCallback((slug) => {
    if (!slug) return 'project-link live-card'
    if (slug.includes('licitir')) return 'project-link project-licitir live-card'
    if (slug.includes('pastoral')) return 'project-link project-pastoral live-card'
    if (slug.includes('diamantista')) return 'project-link project-live live-card'
    return 'project-link live-card'
  }, [])

  return (
    <div className="projects-grid live-grid">
        {liveProjects.map(({ slug, title, image }) => (
        <Link
          key={slug}
          to={`/${slug}`}
          className={resolveClass(slug)}
        >
          <picture>
            <img
              src={image}
              alt={title}
              loading="lazy"
              onLoad={() => markLoaded(slug)}
              onError={() => markLoaded(slug)}
            />
          </picture>
          {/* headers removed for live cards */}
        </Link>
      ))}
    </div>
  )
})

Live.displayName = 'Live'

const Bio = memo(({ sections }) => {
  return (
    <div className="container bio-container">
      {sections.map((section, index) => (
        <div key={index} className="element data">
          <h2><ScrambleText delay={section.delay || 0}>{section.title}</ScrambleText></h2>
          {splitLines(section.text).map((paragraph, idx) => (
            <p key={idx}>
              {parseRichText(paragraph)}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
})

Bio.displayName = 'Bio'

const Contact = memo(({ links }) => {
  return (
    <div className="container contact-container">
      <div className="writings-grid">
        <div className="writing-category">
          <div className="element data">
            <h2></h2>
          </div>
          {links.map(link => (
            <div className="writing-item" key={link.href || link.label}>
              <a
                href={link.href}
                className="contact-link"
                target={link.is_external ? '_blank' : undefined}
                rel={link.is_external ? 'noopener noreferrer' : undefined}
              >
                {link.label}
              </a>
            </div>
          ))}
          <div className="element data instagram-widget">
            <iframe 
              src="https://www.instagram.com/prenatal_amygdala/embed/"
              title="Instagram @prenatal_amygdala"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="instagram-embed"
            />
          </div>
        </div>
        </div>
      </div>
  )
})

Contact.displayName = 'Contact'

const LiveDetail = memo(({ primaryImages, secondaryImages, video, detailHeader = '', detailText = '' }) => {
  const renderSliderOrPlaceholder = (slider, placeholder) => {
    if (!slider || slider.length === 0) {
      return (
        <div className="slider-placeholder">
          <strong>{placeholder}</strong>
        </div>
      )
    }

    return (
      <MediaSlider
        images={slider}
        intervalMs={5000}
        alt={placeholder}
        showNavigation={true}
      />
    )
  }

  const renderVideoSection = () => {
    // eslint-disable-next-line no-console
    console.log('[LiveDetail] video', video)
    if (!video) {
      return (
        <div className="slider-placeholder">
          <strong>Live video coming soon</strong>
          <small>waiting on footage</small>
        </div>
      )
    }

    if (video.type === 'iframe') {
      return (
        <iframe
          className="project-video"
          src={video.src}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      )
    }

    if (video.type === 'video') {
      return (
        <video
          className="project-video"
          controls
          preload="metadata"
          playsInline
          webkit-playsinline="true"
          onError={(e) => {
            // eslint-disable-next-line no-console
            console.warn('[LiveDetail] video failed', e?.currentTarget?.currentSrc || e?.currentTarget?.src, e?.currentTarget?.error)
          }}
        >
          <source src={video.src} type="video/mp4" />
          {/* Fallback link if browser cannot play the video */}
          <a href={video.src} target="_blank" rel="noopener noreferrer">Open video</a>
        </video>
      )
    }

    return null
  }

  return (
    <div className="project-container project-live-detail">
      <div className="project-detail-content">
        <div className="element data">
          <div className="performance-gallery">
            {renderSliderOrPlaceholder(primaryImages, 'slideshow 1')}
          </div>
        </div>
        <div className="media-container">
          <div className="image-section">
            {renderSliderOrPlaceholder(secondaryImages, 'slideshow 2')}
          </div>
          <div className="video-section">
            {renderVideoSection()}
          </div>
        </div>
      </div>
      <div className="project-extra-section">
        <h3 className="project-extra-header">
          {detailHeader ? <ScrambleText delay={0}>{detailHeader}</ScrambleText> : ''}
        </h3>
        <div className="project-extra-body">
          {detailText ? (
            splitLines(detailText).map((paragraph, idx) => (
              <p key={idx}>{parseRichText(paragraph)}</p>
            ))
          ) : (
            // keep container present so editors can see the section in layout
            <p className="project-extra-empty" />
          )}
        </div>
      </div>
    </div>
  )
})

LiveDetail.displayName = 'LiveDetail'

const Project = memo(({ liveDetailMap, dataLoaded }) => {
  const { projectSlug } = useParams()
  const projectData = liveDetailMap[projectSlug]

  // Debug: show project data parsed from Sheets
  // eslint-disable-next-line no-console
  console.debug('[Project] projectData', projectSlug, projectData)

  useEffect(() => {
    // Only redirect if data has finished loading AND project is not found
    if (dataLoaded && projectSlug && !projectData) {
      window.location.href = '/#/live'
    }
  }, [projectSlug, projectData, dataLoaded])

  // Show loading state while data is being fetched
  if (!dataLoaded) {
    return <div className="project-container" style={{ minHeight: '100vh' }} />
  }

  if (!projectData) return null

  return (
    <div className={`project-container project-${projectSlug}`}>
      {(() => {
        const isDev = import.meta.env.DEV
        const sampleHeader = 'About this project'
        const sampleText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus.\n\nSuspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.`

        const detailHeader = projectData.detail_header || (isDev ? sampleHeader : '')
        const detailText = projectData.detail_text || (isDev ? sampleText : '')

        return (
          <LiveDetail
            primaryImages={projectData.primaryImages}
            secondaryImages={projectData.secondaryImages}
            video={projectData.video}
            detailHeader={detailHeader}
            detailText={detailText}
          />
        )
      })()}
    </div>
  )
})

Project.displayName = 'Project'

export default function App() {
  const [releases, setReleases] = useState([])
  const [liveProjects, setLiveProjects] = useState([])
  const [liveDetailMap, setLiveDetailMap] = useState({})
  const [bioSections, setBioSections] = useState([])
  const [contactLinks, setContactLinks] = useState([])
  const [landingSlides, setLandingSlides] = useState([])
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    const SHEET_NAMES = ['LandingSlides', 'Releases', 'LiveGrid', 'LiveDetails', 'LiveSlides', 'Bio', 'Contact']

    const applySheetsToState = (sheets, { allowSetDataLoaded = false } = {}) => {
      const landingSheet = sheets.LandingSlides || []
      const releasesSheet = sheets.Releases || []
      const liveGridSheet = sheets.LiveGrid || []
      const liveDetailsSheet = sheets.LiveDetails || []
      const liveSlidesSheet = sheets.LiveSlides || []
      const bioSheet = sheets.Bio || []
      const contactSheet = sheets.Contact || []

      const landingData = landingSheet
        .map(r => ({
          order: parseNumber(r.order, 0),
          src: r.src,
          caption: r.caption || ''
        }))
        .filter(r => r.src)
        .sort((a, b) => a.order - b.order)
        .map(r => r.src)
      if (landingData.length) setLandingSlides(landingData)

      const releasesData = releasesSheet
        .map(r => ({
          href: r.href,
          title: r.title,
          image: r.image,
          order: parseNumber(r.order, 0)
        }))
        .filter(r => r.href && r.title)
        .sort((a, b) => a.order - b.order)

      const liveGridData = liveGridSheet
        .map(r => ({
          slug: r.slug,
          title: r.title,
          image: r.image,
          order: parseNumber(r.order, 0)
        }))
        .filter(r => r.slug)
        .sort((a, b) => a.order - b.order)

      const slidesById = liveSlidesSheet.reduce((acc, row) => {
        const sliderId = row.slider_id
        if (!sliderId) return acc
        const entry = acc[sliderId] || []
        entry.push({ order: parseNumber(row.order, 0), src: row.src })
        acc[sliderId] = entry
        return acc
      }, {})

      const sortedSlides = Object.fromEntries(
        Object.entries(slidesById).map(([id, items]) => [
          id,
          items
            .filter(item => item.src)
            .sort((a, b) => a.order - b.order)
            .map(item => item.src)
        ])
      )

      const liveDetailsData = liveDetailsSheet.reduce((acc, row) => {
        const slug = row.slug
        if (!slug) return acc
        acc[slug] = {
          title: row.title || slug,
          video: inferVideo(row),
          primaryImages: row.primary_slider_id ? sortedSlides[row.primary_slider_id] || [] : null,
          secondaryImages: row.secondary_slider_id ? sortedSlides[row.secondary_slider_id] || [] : null,
          // Editable section fields from Sheets
          detail_header: row.detail_header || row.detailHeader || '',
          detail_text: row.detail_text || row.detailText || ''
        }
        return acc
      }, {})

      const bioData = bioSheet
        .map(r => ({
          order: parseNumber(r.order, 0),
          title: r.title,
          text: r.text || ''
        }))
        .filter(r => r.title)
        .sort((a, b) => a.order - b.order)

      const contactData = contactSheet
        .map(r => ({
          order: parseNumber(r.order, 0),
          label: r.label,
          href: r.href,
          is_external: (() => {
            const href = String(r.href || '').trim()
            if (!href) return false
            return /^(https?:\/\/|mailto:|tel:)/i.test(href)
          })()
        }))
        .filter(r => r.label && r.href)
        .sort((a, b) => a.order - b.order)

      if (releasesData.length) setReleases(releasesData)
      if (liveGridData.length) setLiveProjects(liveGridData)
      if (Object.keys(liveDetailsData).length) setLiveDetailMap(liveDetailsData)
      if (bioData.length) setBioSections(bioData)
      if (contactData.length) setContactLinks(contactData)

      if (allowSetDataLoaded && Object.keys(liveDetailsData).length) {
        setDataLoaded(true)
      }
    }

    const fetchBatchWithRetry = async (attempts = 3) => {
      for (let i = 0; i < attempts; i++) {
        try {
          return await fetchSheetsBatch(SHEET_NAMES)
        } catch (err) {
          if (i === attempts - 1) throw err
          await sleep(350 * (i + 1))
        }
      }
      return {}
    }

    const load = async () => {
      debugLog('load start')

      // 1) Instant render from cache (even if stale)
      const cachedSheets = {}
      for (const name of SHEET_NAMES) {
        const cached = getCachedSheetAny(name)
        if (cached) cachedSheets[name] = cached
      }
      if (Object.keys(cachedSheets).length) {
        debugLog('cache bootstrap', Object.keys(cachedSheets))
        applySheetsToState(cachedSheets, { allowSetDataLoaded: true })
      }

      // 2) Fresh data in ONE network request
      try {
        const sheets = await fetchBatchWithRetry(3)
        Object.entries(sheets).forEach(([name, rows]) => setCachedSheet(name, rows))
        applySheetsToState(sheets, { allowSetDataLoaded: true })
        setDataLoaded(true)
        debugLog('load done')
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Sheets batch fetch error:', err?.message)
        // If we had no cache, allow app to continue (but avoid redirect)
        if (Object.keys(cachedSheets).length === 0) setDataLoaded(false)
      }
    }

    load()
  }, [])

  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing slides={landingSlides} />} />
        <Route path="/releases" element={<Releases releases={releases} />} />
        <Route path="/live" element={<Live liveProjects={liveProjects} />} />
        <Route path="/bio" element={<Bio sections={bioSections} />} />
        <Route path="/contact" element={<Contact links={contactLinks} />} />
        <Route path="/:projectSlug" element={<Project liveDetailMap={liveDetailMap} dataLoaded={dataLoaded} />} />
      </Routes>
    </Layout>
  )
}
