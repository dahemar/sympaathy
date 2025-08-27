import { useRef, useCallback, useEffect } from 'react'

export const useImageLoader = () => {
  const imgRef = useRef(null)

  const handleLoad = useCallback(() => {
    if (imgRef.current) {
      imgRef.current.classList.add('loaded')
    }
  }, [])

  const handleError = useCallback(() => {
    if (imgRef.current) {
      imgRef.current.classList.add('error')
    }
  }, [])

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    // Check if image is already loaded
    if (img.complete) {
      handleLoad()
    } else {
      img.addEventListener('load', handleLoad, { once: true })
      img.addEventListener('error', handleError, { once: true })
    }

    return () => {
      img.removeEventListener('load', handleLoad)
      img.removeEventListener('error', handleError)
    }
  }, [handleLoad, handleError])

  return imgRef
}

