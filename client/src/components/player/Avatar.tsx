import type { Ref } from 'react'
import type { Mesh } from 'three'
import { colors } from '../../theme/colors'
import { AVATAR_CENTER_Y, AVATAR_HALF_HEIGHT, AVATAR_RADIUS } from './avatarShape'

/**
 * Nhân vật tạm: capsule theo màu `look`, chấm đen phía trước để biết hướng.
 * Gốc toạ độ ở chân (tâm đáy, CLAUDE.md mục 3.3). `bodyRef` dùng để nhún.
 */
export function Avatar({ color, bodyRef }: { color: string; bodyRef?: Ref<Mesh> }) {
  return (
    <mesh ref={bodyRef} position-y={AVATAR_CENTER_Y} castShadow>
      <capsuleGeometry args={[AVATAR_RADIUS, AVATAR_HALF_HEIGHT * 2, 4, 12]} />
      <meshStandardMaterial color={color} />
      <mesh position={[0, 0.45, AVATAR_RADIUS - 0.05]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={colors['langur-black']} />
      </mesh>
    </mesh>
  )
}
