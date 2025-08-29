import { memo, useEffect, useMemo, useState, useCallback } from 'react'

// MediaSlider expects a dataUrl that returns an array of image filenames (strings)
// and a basePath where those images live. Example:
// dataUrl: "/images%202/performance-frames/index.json"
// basePath: "/images%202/performance-frames/"
export const MediaSlider = memo(({ dataUrl, basePath, intervalMs = 6000, alt = '', showNavigation = true }) => {
  const [files, setFiles] = useState([])
  const [index, setIndex] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [lastManualNavigation, setLastManualNavigation] = useState(0)
  const [autoPlayPaused, setAutoPlayPaused] = useState(false)
  const [preloadedImages, setPreloadedImages] = useState(new Set())

  useEffect(() => {
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
  }, [dataUrl])

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

  const hasImages = files.length > 0
  
  // Generate optimized image sources with WebP fallback
  const generateImageSources = useCallback((filename) => {
    if (!filename) return { webp: '', original: '' }
    
    const baseName = filename.replace(/\.[^/.]+$/, '') // Remove extension
    const webpPath = `${basePath}${baseName}.webp`
    const originalPath = `${basePath}${filename}`
    
    return { webp: webpPath, original: originalPath }
  }, [basePath])
  
  const currentImageSources = useMemo(() => {
    if (!hasImages) return { webp: '', original: '' }
    return generateImageSources(files[index])
  }, [hasImages, files, index, generateImageSources])
  


  const goPrev = useCallback(() => {
    if (!hasImages || isNavigating) return
    setIsNavigating(true)
    setAutoPlayPaused(true) // Pause auto-play immediately
    
    setIndex((i) => (i - 1 + files.length) % files.length)
    setLastManualNavigation(Date.now())
    
    // Resume auto-play after 5 seconds
    setTimeout(() => {
      setAutoPlayPaused(false)
      setIsNavigating(false)
    }, 5000)
  }, [files, hasImages, isNavigating])

  const goNext = useCallback(() => {
    if (!hasImages || isNavigating) return
    setIsNavigating(true)
    setAutoPlayPaused(true) // Pause auto-play immediately
    
    setIndex((i) => (i + 1) % files.length)
    setLastManualNavigation(Date.now())
    
    // Resume auto-play after 5 seconds
    setTimeout(() => {
      setAutoPlayPaused(false)
      setIsNavigating(false)
    }, 5000)
  }, [files, hasImages, isNavigating])

  if (!hasImages) return null

  return (
    <div className="media-slider">
      {showNavigation && (
        <>
          <button className="slider-btn prev" onClick={goPrev} aria-label="Previous">‹</button>
          <div className="slide">
            <picture>
              <source srcSet={currentImageSources.webp} type="image/webp" />
              <img 
                src={currentImageSources.original} 
                alt={alt || 'slider image'} 
                loading="eager"
                decoding="async"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  willChange: 'transform'
                }}
              />
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
            />
          </picture>
        </div>
      )}
    </div>
  )
})

MediaSlider.displayName = 'MediaSlider'
