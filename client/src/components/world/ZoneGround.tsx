import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { colors, colorOf } from '../../theme/colors'
import type { ZoneLayout } from '../../systems/content'

/** Màu mặt đường grey-box (chưa có trong bảng màu chính vì chỉ dùng tạm). */
const SURFACE = { road: '#9A9488', plaza: '#E6D8BC' } as const
const WALL_HEIGHT = 6

/** Mặt đất, đường, sân, khối nhà nền và tường vô hình ở rìa khu. */
export function ZoneGround({ layout }: { layout: ZoneLayout }) {
  const half = layout.groundSize / 2
  const b = layout.bounds

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {/* Mặt đất: mặt trên ở y = 0 */}
        <CuboidCollider args={[half, 0.5, half]} position={[0, -0.5, 0]} />
        {/* Tường vô hình quanh khu */}
        <CuboidCollider args={[b, WALL_HEIGHT, 0.5]} position={[0, WALL_HEIGHT, -b]} />
        <CuboidCollider args={[b, WALL_HEIGHT, 0.5]} position={[0, WALL_HEIGHT, b]} />
        <CuboidCollider args={[0.5, WALL_HEIGHT, b]} position={[-b, WALL_HEIGHT, 0]} />
        <CuboidCollider args={[0.5, WALL_HEIGHT, b]} position={[b, WALL_HEIGHT, 0]} />
      </RigidBody>

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[layout.groundSize, layout.groundSize]} />
        <meshStandardMaterial color={colors['karst-green']} />
      </mesh>

      {layout.roads.map((r, i) => (
        <mesh
          key={r.id}
          rotation-x={-Math.PI / 2}
          // Sân nằm cao hơn đường một chút để không nhấp nháy khi chồng lên nhau.
          position={[r.center[0], r.color === 'plaza' ? 0.02 + i * 0.001 : 0.01, r.center[1]]}
          receiveShadow
        >
          <planeGeometry args={r.size} />
          <meshStandardMaterial color={SURFACE[r.color]} />
        </mesh>
      ))}

      {layout.blocks.map((bl, i) => (
        <RigidBody key={i} type="fixed" colliders="cuboid" position={[bl.center[0], bl.size[1] / 2, bl.center[1]]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={bl.size} />
            <meshStandardMaterial color={colorOf(bl.color)} />
          </mesh>
        </RigidBody>
      ))}
    </>
  )
}
