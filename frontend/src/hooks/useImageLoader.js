import { useEffect, useRef } from 'react'

export function useImageLoader() {
  const imageRef = useRef(null)

  useEffect(() => {
    const img = imageRef.current
    if (!img) return

    const handleLoad = () => {
      img.classList.add('loaded')
    }

    if (img.complete) {
      // La imagen ya está cargada
      handleLoad()
    } else {
      // Esperar a que se cargue
      img.addEventListener('load', handleLoad)
    }

    return () => {
      img.removeEventListener('load', handleLoad)
    }
  }, [])

  return imageRef
}

