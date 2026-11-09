import { Client, type Room } from '@colyseus/sdk'
import {
  MOVE_SEND_INTERVAL_MS,
  MSG,
  type Anim,
  type ChatBroadcast,
  type EmoteBroadcast,
  type MoveRequest,
  type Notice,
  type ReportReason,
} from '@shared/protocol'
import { useNetStore, type PlayerInfo } from './netStore'
import { clearPoses, pushPose, removePose } from './interpolation'
import { useChatStore } from '../systems/chat'

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
  name: string
  look: number
}
interface ZoneStateLike {
  quickOnly: boolean
  players: { forEach(cb: (p: PlayerLike, id: string) => void): void }
}

let activeRoom: Room | null = null

// ---------- Gửi ----------

let lastSentAt = 0
let lastSent = ''

/** Gửi vị trí tối đa 10 lần/giây, chỉ khi có thay đổi. */
export function sendMove(m: MoveRequest) {
  if (!activeRoom) return
  const now = performance.now()
  if (now - lastSentAt < MOVE_SEND_INTERVAL_MS) return
  const r = (n: number) => Math.round(n * 100) / 100
  const msg: MoveRequest = { x: r(m.x), y: r(m.y), z: r(m.z), rotY: r(m.rotY), anim: m.anim }
  const key = `${msg.x},${msg.y},${msg.z},${msg.rotY},${msg.anim}`
  if (key === lastSent) return
  activeRoom.send(MSG.move, msg)
  lastSentAt = now
  lastSent = key
}

export const sendChat = (text: string) => activeRoom?.send(MSG.chat, { text })
export const sendQuick = (id: string) => activeRoom?.send(MSG.quick, { id })
export const sendEmote = (id: string) => activeRoom?.send(MSG.emote, { id })
export const sendReport = (target: string, reason: ReportReason) => activeRoom?.send(MSG.report, { target, reason })

// ---------- Nhận ----------

/** Đồng bộ state server → bộ đệm nội suy (mỗi patch) và store React (chỉ khi có người vào/ra, đổi tên/màu). */
function applyState(state: ZoneStateLike, myId: string) {
  const net = useNetStore.getState()
  const prev = net.players
  const next: Record<string, PlayerInfo> = {}
  let changed = false

  state.players.forEach((p, id) => {
    const info = prev[id]
    if (info && info.name === p.name && info.look === p.look) next[id] = info
    else {
      next[id] = { name: p.name, look: p.look }
      changed = true
    }
    if (id !== myId) pushPose(id, { x: p.x, y: p.y, z: p.z, rotY: p.rotY, anim: p.anim as Anim })
  })
  for (const id of Object.keys(prev)) {
    if (!(id in next)) {
      changed = true
      removePose(id)
      useChatStore.getState().forgetPlayer(id)
    }
  }
  if (changed) net.setPlayers(next)
  if (net.quickOnly !== state.quickOnly) net.setQuickOnly(state.quickOnly)
}

/** Vào phòng của một khu. Trả về hàm rời phòng (dùng làm cleanup của useEffect). */
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
      r.onStateChange((state) => applyState(state, r.sessionId))
      r.onMessage(MSG.chat, (msg: ChatBroadcast) => useChatStore.getState().receive(msg, msg.from === r.sessionId))
      r.onMessage(MSG.emote, (msg: EmoteBroadcast) => useChatStore.getState().emote(msg.from, msg.id))
      r.onMessage(MSG.notice, (n: Notice) => useChatStore.getState().setNotice(n.code, n.seconds))
      r.onLeave(() => {
        if (activeRoom === r) activeRoom = null
        clearPoses()
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
    clearPoses()
    useNetStore.getState().reset()
    useChatStore.getState().reset()
  }
}
