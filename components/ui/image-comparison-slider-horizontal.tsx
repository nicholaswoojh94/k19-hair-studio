'use client'
import { useRef, useState, useCallback } from 'react'

interface ImageComparisonSliderProps {
  leftImage: string
  rightImage: string
  altLeft?: string
  altRight?: string
  initialPosition?: number
}

export function ImageComparisonSlider({
  leftImage,
  rightImage,
  altLeft = 'Before',
  altRight = 'After',
  initialPosition = 0.5,
}: ImageComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(initialPosition)

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const { left, width } = el.getBoundingClientRect()
    setPosition(Math.max(0.02, Math.min(0.98, (clientX - left) / width)))
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }, [updatePosition])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return
    updatePosition(e.clientX)
  }, [updatePosition])

  const pct = `${position * 100}%`
  const rightPct = `${(1 - position) * 100}%`

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', overflow: 'hidden', userSelect: 'none', touchAction: 'none', cursor: 'ew-resize' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      {/* Right (After) image — sets container height */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={rightImage}
        alt={altRight}
        style={{ display: 'block', width: '100%', height: 'auto', pointerEvents: 'none', userSelect: 'none' }}
        draggable={false}
      />

      {/* Left (Before) image — clipped to reveal only left portion */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={leftImage}
        alt={altLeft}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          clipPath: `inset(0 ${rightPct} 0 0)`,
          pointerEvents: 'none', userSelect: 'none',
        }}
        draggable={false}
      />

      {/* Divider line */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: pct, transform: 'translateX(-50%)',
        width: 2, background: 'rgba(201,169,110,0.9)',
        pointerEvents: 'none',
      }}>
        {/* Drag handle */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 36, height: 36, borderRadius: '50%',
          background: '#C9A96E', border: '2.5px solid #FAFAF8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
          pointerEvents: 'none',
        }}>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M3 5H13M3 5L1 2.5M3 5L1 7.5M13 5L15 2.5M13 5L15 7.5" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Before label — top-left, clear of bottom caption */}
      <div style={{
        position: 'absolute', top: 8, left: 8,
        background: 'rgba(0,0,0,0.55)', color: '#FAFAF8',
        fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '2px 7px', borderRadius: 3, pointerEvents: 'none',
        fontFamily: "'Poppins',sans-serif",
        opacity: position > 0.08 ? 1 : 0, transition: 'opacity 0.2s ease',
      }}>
        Before
      </div>

      {/* After label — top-right, clear of bottom caption */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        background: 'rgba(0,0,0,0.55)', color: '#FAFAF8',
        fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '2px 7px', borderRadius: 3, pointerEvents: 'none',
        fontFamily: "'Poppins',sans-serif",
        opacity: position < 0.92 ? 1 : 0, transition: 'opacity 0.2s ease',
      }}>
        After
      </div>
    </div>
  )
}
