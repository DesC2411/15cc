import { colors } from '../../theme/colors'
import { useNetStore } from '../../net/netStore'

/**
 * Capsule tạm cho người chơi khác trong phòng (màu cam). Bản thân mình do LocalPlayer vẽ.
 * Hiện chỉ đặt theo patch của server; nội suy cho mượt làm ở giai đoạn 2.
 */
export function RemotePlayers() {
  const players = useNetStore((s) => s.players)
  const me = useNetStore((s) => s.sessionId)

  return (
    <>
      {Object.entries(players)
        .filter(([id]) => id !== me)
        .map(([id, p]) => (
          <mesh key={id} position={[p.x, p.y + 0.9, p.z]} rotation-y={p.rotY} castShadow>
            <capsuleGeometry args={[0.4, 1, 4, 8]} />
            <meshStandardMaterial color={colors['langur-orange']} />
          </mesh>
        ))}
    </>
  )
}
