import { memo, useEffect, useMemo, useState, useCallback } from 'react'

// MediaSlider can consume either:
// 1) dataUrl + basePath (legacy: dataUrl returns ["file1.jpg", ...])
// 2) images: an array of absolute or root-relative URLs (new: Google Sheets)
export const MediaSlider = memo(({ dataUrl, basePath = '', images, intervalMs = 6000, alt = '', showNavigation = true }) => {
  const [files, setFiles] = useState([])
  const [index, setIndex] = useState(0)
  const [lastManualNavigation, setLastManualNavigation] = useState(0)
  const [autoPlayPaused, setAutoPlayPaused] = useState(false)
  const [preloadedImages, setPreloadedImages] = useState(new Set())

  // When images are passed directly, prefer them over dataUrl fetch.
  useEffect(() => {
    if (Array.isArray(images) && images.length) {
      setFiles(images.filter(Boolean))
      setIndex(0)
      return
    }
    if (!dataUrl) return

    let isMounted = true
    fetch(dataUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load slider data'))))
      .then((arr) => {
        if (isMounted && Array.isArray(arr)) {
          setFiles(arr.filter(Boolean))
          setIndex(0)
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [dataUrl, images])

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[MediaSlider]', { mode: Array.isArray(images) ? 'images' : 'dataUrl', count: files.length, sample: files.slice(0, 3) })
  }, [files, images])

  useEffect(() => {
    if (!intervalMs || files.length <= 1 || autoPlayPaused) return
    
    let timeoutId
    const scheduleNext = () => {
      if (autoPlayPaused) return // Don't schedule if paused
      
      const timeSinceLastNav = Date.now() - lastManualNavigation
      const delay = Math.max(intervalMs, intervalMs - timeSinceLastNav)
      
      timeoutId = setTimeout(() => {
        if (!autoPlayPaused) { // Double check before executing
          setIndex((i) => (i + 1) % files.length)
          scheduleNext() // Schedule next iteration
        }
      }, delay)
    }
    
    scheduleNext() // Start the cycle
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [files, intervalMs, lastManualNavigation, autoPlayPaused])
  
  const hasImages = files.length > 0

  // Generate optimized image/video sources, using VITE_R2_BASE when available.
  const R2_BASE = (import.meta.env.VITE_R2_BASE || '').replace(/\/$/, '')
  const joinBase = (base, path) => base ? `${base}/${path.replace(/^\/+/, '')}` : path

  const generateImageSources = useCallback((item) => {
    // item can be a string (filename) or an object { src, mobile_src }
    if (!item) return { webp: '', original: '', isVideo: false, videoSrc: '' }

    let filename = item
    if (typeof item === 'object' && item !== null) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
      filename = (isMobile && item.mobile_src) ? item.mobile_src : item.src
    }

    if (!filename) return { webp: '', original: '', isVideo: false, videoSrc: '' }

    // Normalize filename: trim and ensure root-relative for local assets
    filename = String(filename).trim()
    if (!/^https?:\/\//i.test(filename) && !filename.startsWith('/')) {
      filename = `/${filename}`
    }

    const isVideo = /\.(mp4|mov|webm|ogg|mpg|mpeg)(\?.*)?$/i.test(filename)

    // Absolute URL -> respect as-is
    if (/^https?:\/\//i.test(filename)) {
      if (isVideo) return { webp: '', original: '', isVideo: true, videoSrc: filename }
      return { webp: filename.toLowerCase().endsWith('.webp') ? filename : '', original: filename, isVideo: false, videoSrc: '' }
    }

    // Root-relative paths (start with '/'): treat as local site assets.
    if (filename.startsWith('/')) {
      const original = filename
      if (isVideo) return { webp: '', original: '', isVideo: true, videoSrc: original }
      return { webp: filename.toLowerCase().endsWith('.webp') ? original : '', original, isVideo: false, videoSrc: '' }
    }

    // Relative paths: use `basePath` if provided, otherwise R2_BASE
    const base = basePath || R2_BASE
    const baseClean = (base || '').replace(/\/$/, '')
    if (isVideo) {
      const videoSrc = baseClean ? `${baseClean}/${filename}` : filename
      return { webp: '', original: '', isVideo: true, videoSrc }
    }

    const baseName = filename.replace(/\.[^/.]+$/, '') // Remove extension
    const webpPath = baseClean ? `${baseClean}/${baseName}.webp` : `${baseName}.webp`
    const originalPath = baseClean ? `${baseClean}/${filename}` : filename

    return { webp: webpPath, original: originalPath, isVideo: false, videoSrc: '' }
  }, [basePath])

  // Preload adjacent images when index changes
  useEffect(() => {
    if (hasImages && files.length > 1) {
      const nextIndex = (index + 1) % files.length
      const prevIndex = (index - 1 + files.length) % files.length
      
      const nextSources = generateImageSources(files[nextIndex])
      const prevSources = generateImageSources(files[prevIndex])

      const imagesToPreload = [
        nextSources.webp,
        nextSources.original,
        prevSources.webp,
        prevSources.original
      ]

      imagesToPreload.forEach(src => {
        if (src && !preloadedImages.has(src)) {
          const img = new Image()
          img.onload = () => {
            setPreloadedImages(prev => new Set([...prev, src]))
          }
          img.src = src
        }
      })
    }
  }, [index, hasImages, files, generateImageSources, preloadedImages])
  
  // (moved generateImageSources above)
  
  const currentImageSources = useMemo(() => {
    if (!hasImages) return { webp: '', original: '', isVideo: false, videoSrc: '' }
    return generateImageSources(files[index])
  }, [hasImages, files, index, generateImageSources])
  


  const goPrev = useCallback(() => {
    if (!hasImages) return
    setAutoPlayPaused(true) // Pause auto-play immediately
    
    setIndex((i) => (i - 1 + files.length) % files.length)
    setLastManualNavigation(Date.now())
    
    // Resume auto-play after 3 seconds (reduced from 5)
    setTimeout(() => {
      setAutoPlayPaused(false)
    }, 3000)
  }, [files, hasImages])

  const goNext = useCallback(() => {
    if (!hasImages) return
    setAutoPlayPaused(true) // Pause auto-play immediately
    
    setIndex((i) => (i + 1) % files.length)
    setLastManualNavigation(Date.now())
    
    // Resume auto-play after 3 seconds (reduced from 5)
    setTimeout(() => {
      setAutoPlayPaused(false)
    }, 3000)
  }, [files, hasImages])

  if (!hasImages) return null

  return (
    <div className="media-slider">
      {showNavigation && (
        <>
          <button className="slider-btn prev" onClick={goPrev} aria-label="Previous">‹</button>
          <div className="slide">
            <picture>
                  {currentImageSources.isVideo ? (
                    <video
                      controls
                      preload={index === 0 ? 'auto' : 'metadata'}
                      playsInline
                      webkit-playsinline="true"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    >
                      <source src={currentImageSources.videoSrc} type="video/mp4" />
                      <a href={currentImageSources.videoSrc} target="_blank" rel="noopener noreferrer">Open video</a>
                    </video>
                  ) : (
                    <>
                      <source srcSet={currentImageSources.webp} type="image/webp" />
                      <img 
                        src={currentImageSources.original} 
                        alt={alt || 'slider image'} 
                        loading="eager"
                        decoding="async"
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        onError={(e) => {
                          // eslint-disable-next-line no-console
                          console.warn('[MediaSlider] image failed', e?.currentTarget?.src)
                        }}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'contain',
                          willChange: 'opacity, transform'
                        }}
                      />
                    </>
                  )}
            </picture>
          </div>
          <button className="slider-btn next" onClick={goNext} aria-label="Next">›</button>
        </>
      )}
      {!showNavigation && (
        <div className="slide">
          <picture>
            <source srcSet={currentImageSources.webp} type="image/webp" />
            <img 
              src={currentImageSources.original} 
              alt={alt || 'slider image'} 
              loading="lazy" 
              onError={(e) => {
                // eslint-disable-next-line no-console
                console.warn('[MediaSlider] image failed', e?.currentTarget?.src)
              }}
            />
          </picture>
        </div>
      )}
    </div>
  )
})

MediaSlider.displayName = 'MediaSlider'
