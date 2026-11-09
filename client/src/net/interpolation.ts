import { MOVE_SEND_INTERVAL_MS, type Anim } from '@shared/protocol'

/**
 * Nội suy vị trí người chơi khác (snapshot interpolation).
 * Mỗi lần server gửi patch có thay đổi, lưu một snapshot kèm thời điểm nhận.
 * Khi vẽ, lùi lại INTERP_DELAY_MS rồi nội suy giữa 2 snapshot kẹp thời điểm đó,
 * nên chuyển động mượt dù client chỉ gửi 10 lần/giây và mạng có giật nhẹ.
 */
export const INTERP_DELAY_MS = 150
/** Giữ lịch sử khoảng này phía sau thời điểm vẽ. */
const KEEP_MS = 1000

export interface Pose {
  x: number
  y: number
  z: number
  rotY: number
  anim: Anim
}
interface Snapshot extends Pose {
  t: number
}

const buffers = new Map<string, Snapshot[]>()

const samePose = (a: Pose, b: Pose) =>
  a.x === b.x && a.y === b.y && a.z === b.z && a.rotY === b.rotY && a.anim === b.anim

export function pushPose(id: string, pose: Pose, now = performance.now()) {
  const buf = buffers.get(id)
  if (!buf) {
    buffers.set(id, [{ ...pose, t: now }])
    return
  }
  const last = buf[buf.length - 1]!
  if (samePose(last, pose)) return
  // Đứng yên lâu rồi mới đi: chèn bản sao vị trí cũ ngay trước, để không bị trượt chậm
  // từ snapshot cũ (nhiều giây trước) tới vị trí mới.
  if (now - last.t > MOVE_SEND_INTERVAL_MS * 2) buf.push({ ...last, t: now - MOVE_SEND_INTERVAL_MS })
  buf.push({ ...pose, t: now })
  while (buf.length > 2 && buf[1]!.t < now - INTERP_DELAY_MS - KEEP_MS) buf.shift()
}

export function removePose(id: string) {
  buffers.delete(id)
}

export function clearPoses() {
  buffers.clear()
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpAngle = (a: number, b: number, k: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k

/** Ghi tư thế đã nội suy vào `out`. Trả về false nếu chưa có dữ liệu. */
export function samplePose(id: string, out: Pose, now = performance.now()): boolean {
  const buf = buffers.get(id)
  if (!buf || buf.length === 0) return false
  const t = now - INTERP_DELAY_MS

  let i = buf.length - 1
  while (i > 0 && buf[i]!.t > t) i--
  const a = buf[i]!
  const b = buf[i + 1]
  if (!b || t <= a.t) {
    // Trước snapshot đầu tiên, hoặc đã qua snapshot cuối: giữ nguyên (không đoán trước).
    const s = t <= a.t && i === 0 ? a : buf[buf.length - 1]!
    Object.assign(out, { x: s.x, y: s.y, z: s.z, rotY: s.rotY, anim: s.anim })
    return true
  }
  const k = (t - a.t) / (b.t - a.t)
  out.x = lerp(a.x, b.x, k)
  out.y = lerp(a.y, b.y, k)
  out.z = lerp(a.z, b.z, k)
  out.rotY = lerpAngle(a.rotY, b.rotY, k)
  out.anim = b.anim
  return true
}
