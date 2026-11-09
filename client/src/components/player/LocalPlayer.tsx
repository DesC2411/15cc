import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, useRapier, type RapierCollider, type RapierRigidBody } from '@react-three/rapier'
import { Vector3, type Group, type Mesh } from 'three'
import type { Anim } from '@shared/protocol'
import { lookColor } from '../../theme/colors'
import { cameraControl, input, readMove } from '../../systems/input'
import { createCheckpointTracker } from '../../systems/checkpoints'
import { sendMove } from '../../net/connection'
import { localPlayer } from '../../systems/playerState'
import type { Vec3 } from '../../systems/content'
import { useNetStore } from '../../net/netStore'
import { Avatar } from './Avatar'
import {
  AVATAR_CENTER_Y as CENTER_Y,
  AVATAR_HALF_HEIGHT as HALF_HEIGHT,
  AVATAR_RADIUS as RADIUS,
  bobOffset,
} from './avatarShape'
import { Overhead } from './Overhead'

const WALK_SPEED = 4.5
const RUN_SPEED = 8
const GRAVITY = -25
const JUMP_SPEED = 8
const TURN_RATE = 12
/** Rơi khỏi bản đồ thì đưa về điểm xuất hiện. */
const FALL_RESET_Y = -20

interface Props {
  zone: string
  spawn: Vec3
}

/** Góc ngắn nhất từ a tới b. */
function angleDelta(a: number, b: number) {
  return Math.atan2(Math.sin(b - a), Math.cos(b - a))
}

export function LocalPlayer({ zone, spawn }: Props) {
  const body = useRef<RapierRigidBody>(null)
  const collider = useRef<RapierCollider>(null)
  const avatar = useRef<Group>(null)
  const avatarBody = useRef<Mesh>(null)
  const myId = useNetStore((s) => s.sessionId)
  const me = useNetStore((s) => (s.sessionId ? s.players[s.sessionId] : undefined))
  const { world, rapier } = useRapier()
  const camera = useThree((s) => s.camera)

  // Tạo và gỡ controller trong cùng một effect (StrictMode chạy effect 2 lần, useMemo sẽ giữ bản đã bị gỡ).
  const controllerRef = useRef<ReturnType<typeof world.createCharacterController> | null>(null)
  useEffect(() => {
    const c = world.createCharacterController(0.05)
    c.enableAutostep(0.4, 0.2, false)
    c.enableSnapToGround(0.4)
    c.setMaxSlopeClimbAngle((50 * Math.PI) / 180)
    c.setApplyImpulsesToDynamicBodies(false)
    controllerRef.current = c
    return () => {
      controllerRef.current = null
      world.removeCharacterController(c)
    }
  }, [world])

  const motion = useRef({ vy: 0, grounded: false, rotY: Math.PI })
  const checkpoints = useMemo(() => createCheckpointTracker(zone), [zone])
  const tmp = useMemo(() => ({ target: new Vector3(), desired: new Vector3() }), [])
  const rayRef = useRef<InstanceType<typeof rapier.Ray> | null>(null)

  useFrame(({ clock }, rawDt) => {
    const b = body.current
    const c = collider.current
    const controller = controllerRef.current
    if (!b || !c || !controller) return
    const dt = Math.min(rawDt, 0.05)
    const m = motion.current

    // --- Di chuyển theo hướng camera ---
    const mv = readMove()
    const yaw = cameraControl.yaw
    let dx = Math.cos(yaw) * mv.x - Math.sin(yaw) * mv.y
    let dz = -Math.sin(yaw) * mv.x - Math.cos(yaw) * mv.y
    const len = Math.hypot(dx, dz)
    const amount = Math.min(1, len)
    const speed = (mv.run ? RUN_SPEED : WALK_SPEED) * amount
    if (amount > 0.01) {
      dx /= len
      dz /= len
      const targetRot = Math.atan2(dx, dz)
      m.rotY += angleDelta(m.rotY, targetRot) * Math.min(1, TURN_RATE * dt)
    }

    // --- Trọng lực, nhảy ---
    if (input.jumpQueued) {
      if (m.grounded) m.vy = JUMP_SPEED
      input.jumpQueued = false
    }
    m.vy += GRAVITY * dt

    controller.computeColliderMovement(c, { x: dx * speed * dt, y: m.vy * dt, z: dz * speed * dt })
    const move = controller.computedMovement()
    m.grounded = controller.computedGrounded()
    if (m.grounded && m.vy < 0) m.vy = 0

    const t = b.translation()
    const next = { x: t.x + move.x, y: t.y + move.y, z: t.z + move.z }
    if (next.y < FALL_RESET_Y) {
      next.x = spawn[0]
      next.y = spawn[1] + CENTER_Y + 1
      next.z = spawn[2]
      m.vy = 0
    }
    b.setNextKinematicTranslation(next)

    const anim: Anim = speed < 0.1 ? 'idle' : mv.run ? 'run' : 'walk'
    if (avatar.current) {
      avatar.current.position.set(next.x, next.y - CENTER_Y, next.z)
      avatar.current.rotation.y = m.rotY
    }
    if (avatarBody.current) avatarBody.current.position.y = CENTER_Y + (m.grounded ? bobOffset(anim, clock.elapsedTime) : 0)

    localPlayer.x = next.x
    localPlayer.y = next.y - CENTER_Y
    localPlayer.z = next.z

    // --- Tem, mạng ---
    checkpoints(next.x, next.z)
    sendMove({ x: next.x, y: next.y - CENTER_Y, z: next.z, rotY: m.rotY, anim })

    // --- Camera đi theo, không chui vào tường ---
    const { pitch } = cameraControl
    let dist = cameraControl.distance
    const target = tmp.target.set(next.x, next.y + 0.7, next.z)
    const dir = { x: Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: Math.cos(yaw) * Math.cos(pitch) }
    rayRef.current ??= new rapier.Ray(target, dir)
    const ray = rayRef.current
    ray.origin = { x: target.x, y: target.y, z: target.z }
    ray.dir = dir
    const hit = world.castRay(ray, dist, true, undefined, undefined, c, b)
    if (hit) dist = Math.max(1.5, hit.timeOfImpact - 0.3)
    tmp.desired.set(target.x + dir.x * dist, target.y + dir.y * dist, target.z + dir.z * dist)
    camera.position.lerp(tmp.desired, 1 - Math.exp(-12 * dt))
    camera.lookAt(target)
  })

  return (
    <>
      <RigidBody
        ref={body}
        type="kinematicPosition"
        colliders={false}
        position={[spawn[0], spawn[1] + CENTER_Y, spawn[2]]}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider ref={collider} args={[HALF_HEIGHT, RADIUS]} />
      </RigidBody>

      {/* Màu theo `look` server gán, giống màu người khác nhìn thấy mình. */}
      <group ref={avatar} position={spawn}>
        <Avatar color={lookColor(me?.look ?? 0)} bodyRef={avatarBody} />
        {myId && me && <Overhead id={myId} name={me.name} isMe />}
      </group>
    </>
  )
}
