import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { DirectionalLight } from 'three'
import { localPlayer } from '../../systems/playerState'

/** Hướng nắng chiều (từ nhân vật tới mặt trời). */
const SUN_OFFSET: [number, number, number] = [18, 30, 12]
/** Nửa cạnh vùng có bóng đổ quanh nhân vật (mét). */
const SHADOW_HALF = 30
/** Làm tròn vị trí đèn theo ô shadow map để bóng không rung khi di chuyển. */
const SNAP = (SHADOW_HALF * 2) / 1024

/**
 * Nắng ấm có bóng đổ. Vùng bóng nhỏ, đi theo nhân vật, rẻ hơn nhiều so với phủ bóng cả khu (quan trọng cho điện thoại).
 */
export function SunLight() {
  const light = useRef<DirectionalLight>(null)

  useEffect(() => {
    const l = light.current
    if (!l) return
    l.parent?.add(l.target)
    return () => void l.parent?.remove(l.target)
  }, [])

  useFrame(() => {
    const l = light.current
    if (!l) return
    const x = Math.round(localPlayer.x / SNAP) * SNAP
    const z = Math.round(localPlayer.z / SNAP) * SNAP
    l.target.position.set(x, 0, z)
    l.position.set(x + SUN_OFFSET[0], SUN_OFFSET[1], z + SUN_OFFSET[2])
  })

  return (
    <directionalLight
      ref={light}
      intensity={1.4}
      color="#FFE8C2"
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-SHADOW_HALF}
      shadow-camera-right={SHADOW_HALF}
      shadow-camera-top={SHADOW_HALF}
      shadow-camera-bottom={-SHADOW_HALF}
      shadow-camera-near={1}
      shadow-camera-far={90}
      shadow-bias={-0.0005}
    />
  )
}
