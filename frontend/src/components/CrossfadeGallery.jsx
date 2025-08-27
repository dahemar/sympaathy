import { memo, useEffect, useMemo, useState, useCallback } from 'react'

export const CrossfadeGallery = memo(({ dataUrl, basePath, intervalMs = 4000, alt = '', fallbackSrc, showNavigation = false }) => {
  const [files, setFiles] = useState([])
  const [index, setIndex] = useState(0)
  const [previousSrc, setPreviousSrc] = useState('')
  const [isFading, setIsFading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    console.log('CrossfadeGallery: Fetching data from:', dataUrl)
    fetch(dataUrl)
      .then((r) => {
        console.log('CrossfadeGallery: Response status:', r.status)
        return r.ok ? r.json() : Promise.reject(new Error('Failed to load gallery data'))
      })
      .then((arr) => {
        console.log('CrossfadeGallery: Received data:', arr)
        if (isMounted && Array.isArray(arr) && arr.length > 0) {
          const filtered = arr.filter(Boolean)
          console.log('CrossfadeGallery: Filtered files:', filtered)
          setFiles(filtered)
          setIndex(0)
          setPreviousSrc('')
          setIsFading(false)
          setIsLoading(false)
        } else {
          setIsLoading(false)
        }
      })
      .catch((error) => {
        console.error('CrossfadeGallery: Error loading data:', error)
        setIsLoading(false)
      })
    return () => { isMounted = false }
  }, [dataUrl])

  const currentSrc = useMemo(() => (files.length ? basePath + files[index] : (fallbackSrc || '')), [files, basePath, index, fallbackSrc])

  const preloadAndSwap = useCallback((targetIndex) => {
    if (!files.length) return
    const nextSrc = basePath + files[targetIndex]
    const img = new Image()
    img.onload = () => {
      setPreviousSrc(currentSrc)
      setIndex(targetIndex)
      setIsFading(true)
      // Match CSS transition duration
      setTimeout(() => setIsFading(false), 600)
    }
    img.src = nextSrc
  }, [files, basePath, currentSrc])

  useEffect(() => {
    if (files.length <= 1 || !intervalMs) return
    const id = setInterval(() => {
      const nextIndex = (index + 1) % files.length
      preloadAndSwap(nextIndex)
    }, intervalMs)
    return () => clearInterval(id)
  }, [files, index, intervalMs, preloadAndSwap])

  const goPrev = useCallback(() => {
    if (files.length <= 1) return
    const prevIndex = (index - 1 + files.length) % files.length
    preloadAndSwap(prevIndex)
  }, [files, index, preloadAndSwap])

  const goNext = useCallback(() => {
    if (files.length <= 1) return
    const nextIndex = (index + 1) % files.length
    preloadAndSwap(nextIndex)
  }, [files, index, preloadAndSwap])

  if (isLoading) {
    console.log('CrossfadeGallery: Loading data, showing nothing')
    return null
  }

  if (!files.length && !fallbackSrc) {
    console.log('CrossfadeGallery: No files and no fallback, returning null')
    return null
  }

  if (!files.length && fallbackSrc) {
    console.log('CrossfadeGallery: Using fallback image:', fallbackSrc)
    return (
      <div className="crossfade-container CrossfadeGallery">
        <img
          src={fallbackSrc}
          alt={alt || 'gallery fallback image'}
          className="crossfade-image visible"
          loading="lazy"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    )
  }

  console.log('CrossfadeGallery: Rendering with', files.length, 'files, current index:', index)
  return (
    <div className="crossfade-container CrossfadeGallery">
      {previousSrc ? (
        <img
          src={previousSrc}
          alt={alt || 'gallery image previous'}
          className={`crossfade-image ${isFading ? 'fade-out' : 'hidden'}`}
          loading="eager"
        />
      ) : null}
      <img
        key={currentSrc}
        src={currentSrc}
        alt={alt || 'gallery image current'}
        className={`crossfade-image ${isFading ? 'fade-in' : 'visible'}`}
        loading="eager"
      />
      {showNavigation && files.length > 1 && (
        <>
          <button className="crossfade-btn prev" onClick={goPrev} aria-label="Previous">‹</button>
          <button className="crossfade-btn next" onClick={goNext} aria-label="Next">›</button>
        </>
      )}
    </div>
  )
})

CrossfadeGallery.displayName = 'CrossfadeGallery'
