import { memo, useEffect, useMemo, useState, useCallback } from 'react'

// MediaSlider expects a dataUrl that returns an array of image filenames (strings)
// and a basePath where those images live. Example:
// dataUrl: "/images%202/performance-frames/index.json"
// basePath: "/images%202/performance-frames/"
export const MediaSlider = memo(({ dataUrl, basePath, intervalMs = 0, alt = '' }) => {
  const [files, setFiles] = useState([])
  const [index, setIndex] = useState(0)

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
    if (!intervalMs || files.length <= 1) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % files.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [files, intervalMs])

  const hasImages = files.length > 0
  const currentSrc = useMemo(() => (hasImages ? basePath + files[index] : ''), [hasImages, basePath, files, index])

  const goPrev = useCallback(() => {
    if (!hasImages) return
    setIndex((i) => (i - 1 + files.length) % files.length)
  }, [files, hasImages])

  const goNext = useCallback(() => {
    if (!hasImages) return
    setIndex((i) => (i + 1) % files.length)
  }, [files, hasImages])

  if (!hasImages) return null

  return (
    <div className="media-slider">
      <button className="slider-btn prev" onClick={goPrev} aria-label="Previous">‹</button>
      <div className="slide">
        {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
        <img src={currentSrc} alt={alt || 'slider image'} loading="lazy" />
      </div>
      <button className="slider-btn next" onClick={goNext} aria-label="Next">›</button>
    </div>
  )
})

MediaSlider.displayName = 'MediaSlider'
