'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function usePageTransition() {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [previousPath, setPreviousPath] = useState(pathname)

  useEffect(() => {
    if (pathname !== previousPath) {
      setIsTransitioning(true)
      setPreviousPath(pathname)
      
      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [pathname, previousPath])

  return {
    isTransitioning,
    currentPath: pathname,
    previousPath,
  }
}