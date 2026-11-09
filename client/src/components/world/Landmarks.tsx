import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { Group } from 'three'
import { colors, colorOf } from '../../theme/colors'
import { CHECKPOINT_RADIUS, checkpointOf, type Landmark } from '../../systems/content'
import { useStampStore } from '../../systems/stamps'
import './Landmarks.css'

/** Khối tạm cho một landmark + collider hộp (CLAUDE.md mục 7.1: collider hình đơn giản tạo trong code). */
function LandmarkBlock({ l }: { l: Landmark }) {
  const [w, h, d] = l.size
  return (
    <RigidBody type="fixed" colliders={false} position={l.position} rotation-y={l.rotationY}>
      <CuboidCollider args={[w / 2, h / 2, d / 2]} position={[0, h / 2, 0]} />
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={l.size} />
        <meshStandardMaterial color={colorOf(l.color)} />
      </mesh>
      {/* Dải màu nhấn đánh dấu mặt tiền */}
      <mesh position={[0, h * 0.35, d / 2 + 0.05]}>
        <boxGeometry args={[w * 0.4, h * 0.5, 0.1]} />
        <meshStandardMaterial color={colors['phuong-red-dark']} />
      </mesh>
    </RigidBody>
  )
}

/** Vòng nhận tem trước mặt tiền: đỏ khi chưa có tem, vàng khi đã nhận. */
function CheckpointMarker({ l }: { l: Landmark }) {
  const [x, z] = checkpointOf(l)
  const collected = useStampStore((s) => l.id in s.collected)
  const stamp = useRef<Group>(null)
  const tint = collected ? colors['sun-yellow'] : colors['phuong-red']

  useFrame(({ clock }) => {
    if (!stamp.current) return
    const t = clock.elapsedTime
    stamp.current.rotation.y = t * 1.5
    stamp.current.position.y = 2.2 + Math.sin(t * 2) * 0.15
  })

  return (
    <group position={[x, 0, z]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.04}>
        <ringGeometry args={[CHECKPOINT_RADIUS - 0.35, CHECKPOINT_RADIUS, 40]} />
        <meshBasicMaterial color={tint} />
      </mesh>
      <group ref={stamp}>
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.55, 0.55, 0.12, 20]} />
          <meshStandardMaterial color={tint} emissive={tint} emissiveIntensity={0.25} />
        </mesh>
      </group>
      <Html position={[0, 3.4, 0]} center zIndexRange={[10, 0]} className="lm-label-wrap">
        <div className={`lm-label${collected ? ' lm-label--done' : ''}`}>{l.name}</div>
      </Html>
    </group>
  )
}

export function Landmarks({ items }: { items: Landmark[] }) {
  return (
    <>
      {items.map((l) => (
        <group key={l.id}>
          <LandmarkBlock l={l} />
          <CheckpointMarker l={l} />
        </group>
      ))}
    </>
  )
}
