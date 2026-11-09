import { CHECKPOINT_RADIUS, checkpointOf, landmarksInZone } from './content'
import { useStampStore } from './stamps'

/**
 * Kiểm tra người chơi bước vào vùng nhận tem trước mặt tiền landmark.
 * Chỉ kích hoạt lúc bước vào (từ ngoài vào trong), không lặp lại khi đứng yên trong vùng.
 */
export function createCheckpointTracker(zone: string) {
  const points = landmarksInZone(zone).map((l) => ({ id: l.id, at: checkpointOf(l) }))
  const inside = new Set<string>()

  return function update(x: number, z: number) {
    for (const p of points) {
      const isIn = Math.hypot(x - p.at[0], z - p.at[1]) <= CHECKPOINT_RADIUS
      if (isIn && !inside.has(p.id)) {
        inside.add(p.id)
        useStampStore.getState().visit(p.id)
      } else if (!isIn) {
        inside.delete(p.id)
      }
    }
  }
}
