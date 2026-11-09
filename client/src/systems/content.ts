import landmarksData from '@content/landmarks.json'

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
