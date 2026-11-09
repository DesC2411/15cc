import { useLayoutEffect, useMemo, useRef } from 'react'
import { CylinderCollider, RigidBody } from '@react-three/rapier'
import { Color, Object3D, type InstancedMesh } from 'three'
import { colors } from '../../theme/colors'

const TRUNK_HEIGHT = 2.6
const TRUNK_RADIUS = 0.25
const CANOPY_RADIUS = 2.4

/**
 * Hàng phượng grey-box: thân + tán dùng instancing (1 draw call mỗi phần), collider trụ cho thân cây.
 * Mỗi cây xoay và co giãn ngẫu nhiên nhẹ (có hạt giống cố định) để hàng cây đỡ đều đặn.
 */
export function FlamboyantTrees({ positions }: { positions: [number, number][] }) {
  const trunks = useRef<InstancedMesh>(null)
  const canopies = useRef<InstancedMesh>(null)

  const variants = useMemo(
    () =>
      positions.map(([x, z], i) => {
        // Giả ngẫu nhiên ổn định theo vị trí, để mọi người chơi thấy giống nhau.
        const r = Math.abs(Math.sin(x * 12.9898 + z * 78.233 + i) * 43758.5453) % 1
        return { x, z, scale: 0.85 + r * 0.3, rot: r * Math.PI * 2, shade: r }
      }),
    [positions],
  )

  useLayoutEffect(() => {
    const t = trunks.current
    const c = canopies.current
    if (!t || !c) return
    const o = new Object3D()
    const red = new Color(colors['phuong-red'])
    const redDark = new Color(colors['phuong-red-dark'])
    const tint = new Color()
    variants.forEach((v, i) => {
      o.position.set(v.x, (TRUNK_HEIGHT * v.scale) / 2, v.z)
      o.rotation.set(0, v.rot, 0)
      o.scale.set(1, v.scale, 1)
      o.updateMatrix()
      t.setMatrixAt(i, o.matrix)

      o.position.set(v.x, TRUNK_HEIGHT * v.scale + CANOPY_RADIUS * 0.35, v.z)
      o.scale.set(v.scale, v.scale * 0.6, v.scale)
      o.updateMatrix()
      c.setMatrixAt(i, o.matrix)
      c.setColorAt(i, tint.copy(red).lerp(redDark, v.shade * 0.5))
    })
    t.instanceMatrix.needsUpdate = true
    c.instanceMatrix.needsUpdate = true
    if (c.instanceColor) c.instanceColor.needsUpdate = true
    t.computeBoundingSphere()
    c.computeBoundingSphere()
  }, [variants])

  if (variants.length === 0) return null

  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, variants.length]} castShadow>
        <cylinderGeometry args={[TRUNK_RADIUS * 0.8, TRUNK_RADIUS, TRUNK_HEIGHT, 6]} />
        <meshStandardMaterial color="#6B4A35" flatShading />
      </instancedMesh>
      <instancedMesh ref={canopies} args={[undefined, undefined, variants.length]} castShadow>
        <icosahedronGeometry args={[CANOPY_RADIUS, 0]} />
        <meshStandardMaterial flatShading />
      </instancedMesh>

      <RigidBody type="fixed" colliders={false}>
        {variants.map((v, i) => (
          <CylinderCollider
            key={i}
            args={[(TRUNK_HEIGHT * v.scale) / 2, TRUNK_RADIUS + 0.1]}
            position={[v.x, (TRUNK_HEIGHT * v.scale) / 2, v.z]}
          />
        ))}
      </RigidBody>
    </>
  )
}
