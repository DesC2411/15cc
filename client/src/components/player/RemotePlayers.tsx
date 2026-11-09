import { colors } from '../../theme/colors'
import { useNetStore } from '../../net/netStore'

/** Capsule tạm cho mỗi người chơi trong phòng. Mình màu đỏ phượng, người khác màu cam. */
export function RemotePlayers() {
  const players = useNetStore((s) => s.players)
  const me = useNetStore((s) => s.sessionId)

  return (
    <>
      {Object.entries(players).map(([id, p]) => (
        <mesh key={id} position={[p.x, p.y + 0.9, p.z]} rotation-y={p.rotY} castShadow>
          <capsuleGeometry args={[0.4, 1, 4, 8]} />
          <meshStandardMaterial color={id === me ? colors['phuong-red'] : colors['langur-orange']} />
        </mesh>
      ))}
    </>
  )
}
