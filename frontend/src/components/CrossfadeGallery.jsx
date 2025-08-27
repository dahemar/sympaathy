import { memo, useEffect, useMemo, useState, useCallback } from 'react'

export const CrossfadeGallery = memo(({ dataUrl, basePath, intervalMs = 4000, alt = '', fallbackSrc, showNavigation = false }) => {
  const [files, setFiles] = useState([])
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true
    fetch(dataUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load gallery data'))))
      .then((arr) => {
        if (isMounted && Array.isArray(arr) && arr.length > 0) {
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
    if (files.length <= 1 || showNavigation) return
    const id = setInterval(() => {
      setLoaded(false)
      setIndex((i) => (i + 1) % files.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [files, intervalMs, showNavigation])

  const currentSrc = useMemo(() => (files.length ? basePath + files[index] : fallbackSrc), [files, basePath, index, fallbackSrc])
  const onLoad = useCallback(() => setLoaded(true), [])

  const goPrev = useCallback(() => {
    if (files.length <= 1) return
    setLoaded(false)
    setIndex((i) => (i - 1 + files.length) % files.length)
  }, [files])

  const goNext = useCallback(() => {
    if (files.length <= 1) return
    setLoaded(false)
    setIndex((i) => (i + 1) % files.length)
  }, [files])

  if (!files.length && !fallbackSrc) return null

  return (
    <div className="crossfade-container">
      {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
      <img
        key={currentSrc}
        src={currentSrc}
        alt={alt || 'gallery image'}
        className={`crossfade-image${loaded ? ' loaded' : ''}`}
        loading="lazy"
        onLoad={onLoad}
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
