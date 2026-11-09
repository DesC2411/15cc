import landmarksData from '@content/landmarks.json'
import centralZoneData from '@content/zones/central.json'

export type Vec3 = [number, number, number]

export interface Landmark {
  id: string
  name: string
  zone: string
  position: Vec3
  rotationY: number
  size: Vec3
  color: string
  model: string
  secret: string
  source: string[]
  verified: boolean
  mapsUrl: string
}

function isVec3(v: unknown): v is Vec3 {
  return Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === 'number' && Number.isFinite(n))
}

/** Kiểm tra dữ liệu landmark khi tải, sai thì báo rõ id để sửa file content. */
function parseLandmarks(raw: unknown[]): Landmark[] {
  return raw.map((item, i) => {
    const l = item as Partial<Landmark>
    const where = `landmarks.json [${i}] ${l.id ?? '(thiếu id)'}`
    if (typeof l.id !== 'string' || typeof l.zone !== 'string') throw new Error(`${where}: thiếu id/zone`)
    if (!isVec3(l.position) || !isVec3(l.size)) throw new Error(`${where}: position/size phải là [x, y, z]`)
    if (l.verified === true && (!Array.isArray(l.source) || l.source.length < 2)) {
      console.warn(`${where}: verified=true nhưng chưa đủ 2 nguồn (CLAUDE.md mục 4.2)`)
    }
    return l as Landmark
  })
}

export const landmarks = parseLandmarks(landmarksData.landmarks)

export function landmarksInZone(zone: string): Landmark[] {
  return landmarks.filter((l) => l.zone === zone)
}

/** Bản production chỉ hiện Thẻ Bí Mật đã kiểm chứng (CLAUDE.md mục 3.5). */
export function canShowSecret(l: Landmark): boolean {
  return l.secret.length > 0 && (l.verified || import.meta.env.DEV)
}

/** Bán kính vùng nhận tem (mét) và khoảng cách từ mặt tiền tới tâm vùng. */
export const CHECKPOINT_RADIUS = 2.5
const CHECKPOINT_GAP = 3

/**
 * Tâm vùng nhận tem: đặt trước mặt tiền (hướng +Z cục bộ của công trình, xoay theo rotationY).
 * Trả về [x, z] trên mặt đất.
 */
export function checkpointOf(l: Landmark): [number, number] {
  const d = l.size[2] / 2 + CHECKPOINT_GAP
  return [l.position[0] + Math.sin(l.rotationY) * d, l.position[2] + Math.cos(l.rotationY) * d]
}

// ---------- Bố cục khu (content/zones/<zone>.json) ----------

export interface ZoneRoad {
  id: string
  center: [number, number]
  size: [number, number]
  color: 'road' | 'plaza'
}

export interface ZoneLayout {
  zone: string
  groundSize: number
  bounds: number
  spawn: Vec3
  roads: ZoneRoad[]
  treeRows: { from: [number, number]; to: [number, number]; spacing: number }[]
  blocks: { center: [number, number]; size: Vec3; color: string }[]
}

const zoneLayouts: Record<string, ZoneLayout> = {
  central: centralZoneData as unknown as ZoneLayout,
}

export function zoneLayout(zone: string): ZoneLayout {
  const layout = zoneLayouts[zone]
  if (!layout) throw new Error(`Chưa có bố cục cho khu "${zone}" trong content/zones/`)
  if (!isVec3(layout.spawn)) throw new Error(`content/zones/${zone}.json: spawn phải là [x, y, z]`)
  return layout
}

/**
 * Vị trí từng cây phượng theo các hàng trong bố cục khu.
 * Bỏ cây nằm quá gần vùng nhận tem để lối vào không bị chắn.
 */
export function treePositions(layout: ZoneLayout): [number, number][] {
  const keepClear = landmarksInZone(layout.zone).map(checkpointOf)
  const out: [number, number][] = []
  for (const row of layout.treeRows) {
    const dx = row.to[0] - row.from[0]
    const dz = row.to[1] - row.from[1]
    const len = Math.hypot(dx, dz)
    const n = Math.max(1, Math.floor(len / row.spacing))
    for (let i = 0; i <= n; i++) {
      const x = row.from[0] + (dx * i) / n
      const z = row.from[1] + (dz * i) / n
      const blocked = keepClear.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < CHECKPOINT_RADIUS + 2)
      if (!blocked) out.push([x, z])
    }
  }
  return out
}
