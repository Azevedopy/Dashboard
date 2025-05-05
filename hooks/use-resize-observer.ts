"use client"

import { useEffect, useState, useRef } from "react"

export function useResizeObserver(ref) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const resizeObserver = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    if (ref.current) {
      resizeObserver.current = new ResizeObserver((entries) => {
        if (entries[0]) {
          const { width, height } = entries[0].contentRect
          setDimensions({ width, height })
        }
      })

      resizeObserver.current.observe(ref.current)
    }

    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect()
      }
    }
  }, [ref])

  return dimensions
}
