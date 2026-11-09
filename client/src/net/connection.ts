import { Client, type Room } from '@colyseus/sdk'
import { useNetStore, type RemotePlayer } from './netStore'

/**
 * Mặc định nối qua cùng địa chỉ với trang, đường dẫn /colyseus (Vite chuyển tiếp sang server 2567),
 * nên mở từ LAN, Tailscale Funnel hay https đều chạy. Đặt VITE_SERVER_URL để nối thẳng tới server khác.
 */
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? `${location.origin}/colyseus`

const client = new Client(SERVER_URL)

interface PlayerLike {
  x: number
  y: number
  z: number
  rotY: number
  anim: string
}
interface ZoneStateLike {
  players: { forEach(cb: (p: PlayerLike, id: string) => void): void }
}

function snapshot(state: ZoneStateLike): Record<string, RemotePlayer> {
  const out: Record<string, RemotePlayer> = {}
  state.players.forEach((p, id) => {
    out[id] = { x: p.x, y: p.y, z: p.z, rotY: p.rotY, anim: p.anim }
  })
  return out
}

/**
 * Vào phòng của một khu. Trả về hàm rời phòng (dùng làm cleanup của useEffect).
 * Hiện chỉ chép state về store mỗi lần server gửi patch. Nội suy làm ở giai đoạn 2.
 */
let activeRoom: Room | null = null

export interface MoveState {
  x: number
  y: number
  z: number
  rotY: number
  anim: 'idle' | 'walk' | 'run'
}

/** Gửi vị trí tối đa 10 lần/giây, chỉ khi có thay đổi. */
const SEND_INTERVAL_MS = 100
let lastSentAt = 0
let lastSent = ''

export function sendMove(m: MoveState) {
  if (!activeRoom) return
  const now = performance.now()
  if (now - lastSentAt < SEND_INTERVAL_MS) return
  const r = (n: number) => Math.round(n * 100) / 100
  const msg = { x: r(m.x), y: r(m.y), z: r(m.z), rotY: r(m.rotY), anim: m.anim }
  const key = `${msg.x},${msg.y},${msg.z},${msg.rotY},${msg.anim}`
  if (key === lastSent) return
  activeRoom.send('move', msg)
  lastSentAt = now
  lastSent = key
}

export function joinZone(zone: string): () => void {
  const store = useNetStore.getState()
  let room: Room | null = null
  let cancelled = false

  store.setStatus('connecting')

  client
    .joinOrCreate<ZoneStateLike>('zone', { zone })
    .then((r) => {
      if (cancelled) {
        void r.leave()
        return
      }
      room = r
      activeRoom = r
      lastSent = ''
      useNetStore.getState().setSession(zone, r.sessionId)
      useNetStore.getState().setStatus('connected')
      r.onStateChange((state) => useNetStore.getState().setPlayers(snapshot(state)))
      r.onLeave(() => {
        if (activeRoom === r) activeRoom = null
        useNetStore.getState().reset()
      })
      r.onError((code, message) => {
        console.warn('[net] lỗi phòng', code, message)
        useNetStore.getState().setStatus('error')
      })
    })
    .catch((err: unknown) => {
      if (cancelled) return
      console.warn('[net] không vào được phòng', err)
      useNetStore.getState().setStatus('error')
    })

  return () => {
    cancelled = true
    if (room) void room.leave()
    if (activeRoom === room) activeRoom = null
    useNetStore.getState().reset()
  }
}
