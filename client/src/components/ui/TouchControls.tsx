import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { input } from '../../systems/input'
import { t } from '../../systems/i18n'
import './hud.css'

/** Bán kính (px) mà núm joystick được kéo ra khỏi tâm. */
const KNOB_RANGE = 44

/** Hiện điều khiển cảm ứng trên máy có màn hình cảm ứng hoặc màn hình hẹp. */
function useTouchUi(): boolean {
  const query = '(pointer: coarse), (max-width: 820px)'
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return match
}

/** Joystick ảo bên trái + nút hành động bên phải (CLAUDE.md mục 3.4). */
export function TouchControls() {
  const show = useTouchUi()
  const base = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const activeId = useRef<number | null>(null)

  const release = () => {
    activeId.current = null
    input.joyX = 0
    input.joyY = 0
    setKnob({ x: 0, y: 0 })
  }
  useEffect(() => release, [])

  const track = (e: ReactPointerEvent) => {
    const el = base.current
    if (!el || e.pointerId !== activeId.current) return
    const r = el.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const len = Math.hypot(dx, dy)
    if (len > KNOB_RANGE) {
      dx = (dx / len) * KNOB_RANGE
      dy = (dy / len) * KNOB_RANGE
    }
    setKnob({ x: dx, y: dy })
    input.joyX = dx / KNOB_RANGE
    input.joyY = -dy / KNOB_RANGE
  }

  if (!show) return null

  return (
    <>
      <div
        ref={base}
        className="joystick"
        aria-label={t('hud.joystick')}
        onPointerDown={(e) => {
          if (activeId.current !== null) return
          activeId.current = e.pointerId
          e.currentTarget.setPointerCapture(e.pointerId)
          track(e)
        }}
        onPointerMove={track}
        onPointerUp={(e) => e.pointerId === activeId.current && release()}
        onPointerCancel={(e) => e.pointerId === activeId.current && release()}
      >
        <div className="joystick__knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>

      <button
        type="button"
        className="action-btn"
        onPointerDown={(e) => {
          e.preventDefault()
          input.jumpQueued = true
        }}
      >
        {t('hud.jump')}
      </button>
    </>
  )
}
