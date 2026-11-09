import { Client, type Room } from '@colyseus/sdk'
import { useNetStore, type RemotePlayer } from './netStore'

/** Mặc định nối tới máy đang mở trang (để điện thoại cùng Wi-Fi vẫn vào được). */
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ?? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:2567`

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
 * Giai đoạn 0: chỉ chép state về store mỗi lần server gửi patch. Nội suy làm ở giai đoạn 2.
 */
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
      useNetStore.getState().setSession(zone, r.sessionId)
      useNetStore.getState().setStatus('connected')
      r.onStateChange((state) => useNetStore.getState().setPlayers(snapshot(state)))
      r.onLeave(() => useNetStore.getState().reset())
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
    useNetStore.getState().reset()
  }
}
