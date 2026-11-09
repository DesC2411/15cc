import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { lookColor } from '../../theme/colors'
import { useNetStore, type PlayerInfo } from '../../net/netStore'
import { samplePose, type Pose } from '../../net/interpolation'
import { localPlayer } from '../../systems/playerState'
import { useChatStore } from '../../systems/chat'
import { Avatar } from './Avatar'
import { AVATAR_CENTER_Y, bobOffset } from './avatarShape'
import { Overhead } from './Overhead'

/** Xa hơn khoảng này thì ẩn tên/bong bóng để màn hình đỡ rối và đỡ tốn DOM. */
const LABEL_HIDE_DISTANCE = 30

const RemotePlayer = memo(function RemotePlayer({ id, info }: { id: string; info: PlayerInfo }) {
  const group = useRef<Group>(null)
  const body = useRef<Mesh>(null)
  const label = useRef<HTMLDivElement>(null)
  const pose = useRef<Pose>({ x: 0, y: 0, z: 0, rotY: 0, anim: 'idle' })
  const blocked = useChatStore((s) => !!s.blocked[id])

  useFrame(({ clock }) => {
    const p = pose.current
    const g = group.current
    if (!g || !samplePose(id, p)) return
    g.position.set(p.x, p.y, p.z)
    g.rotation.y = p.rotY
    if (body.current) body.current.position.y = AVATAR_CENTER_Y + bobOffset(p.anim, clock.elapsedTime)
    if (label.current) {
      const far = Math.hypot(p.x - localPlayer.x, p.z - localPlayer.z) > LABEL_HIDE_DISTANCE
      label.current.style.visibility = far ? 'hidden' : ''
    }
  })

  return (
    <group ref={group}>
      <Avatar color={lookColor(info.look)} bodyRef={body} />
      {!blocked && <Overhead id={id} name={info.name} wrapRef={label} />}
    </group>
  )
})

/** Người chơi khác trong phòng, vị trí nội suy từ net/interpolation.ts. Bản thân mình do LocalPlayer vẽ. */
export function RemotePlayers() {
  const players = useNetStore((s) => s.players)
  const me = useNetStore((s) => s.sessionId)

  return (
    <>
      {Object.entries(players)
        .filter(([id]) => id !== me)
        .map(([id, info]) => (
          <RemotePlayer key={id} id={id} info={info} />
        ))}
    </>
  )
}
