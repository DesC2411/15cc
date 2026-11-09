import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { CAMERA_LIMITS, cameraControl } from '../../systems/input'

const ROTATE_SPEED = 0.008
const PINCH_SPEED = 0.03

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/**
 * Kéo trên vùng 3D để xoay camera quanh nhân vật; con lăn chuột hoặc hai ngón tay để phóng to/thu nhỏ.
 * Joystick là phần tử DOM riêng nên ngón tay trên joystick không làm xoay camera.
 */
export function CameraDrag() {
  const el = useThree((s) => s.gl.domElement)

  useEffect(() => {
    const pointers = new Map<number, { x: number; y: number }>()
    let pinchDist = 0

    const spread = () => {
      const [a, b] = [...pointers.values()]
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
    }

    const onDown = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId)
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 2) pinchDist = spread()
    }
    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId)
      if (!prev) return
      const cur = { x: e.clientX, y: e.clientY }
      pointers.set(e.pointerId, cur)
      if (pointers.size === 1) {
        cameraControl.yaw -= (cur.x - prev.x) * ROTATE_SPEED
        cameraControl.pitch = clamp(
          cameraControl.pitch + (cur.y - prev.y) * ROTATE_SPEED,
          CAMERA_LIMITS.minPitch,
          CAMERA_LIMITS.maxPitch,
        )
      } else if (pointers.size === 2) {
        const d = spread()
        cameraControl.distance = clamp(
          cameraControl.distance - (d - pinchDist) * PINCH_SPEED,
          CAMERA_LIMITS.minDistance,
          CAMERA_LIMITS.maxDistance,
        )
        pinchDist = d
      }
    }
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      if (pointers.size === 2) pinchDist = spread()
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cameraControl.distance = clamp(
        cameraControl.distance + e.deltaY * 0.01,
        CAMERA_LIMITS.minDistance,
        CAMERA_LIMITS.maxDistance,
      )
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [el])

  return null
}
