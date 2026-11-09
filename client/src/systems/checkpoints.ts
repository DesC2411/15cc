import { CHECKPOINT_RADIUS, checkpointOf, landmarksInZone } from './content'
import { useStampStore } from './stamps'

/** Phải ra xa hơn bán kính chừng này mới tính là đã rời vòng, tránh bật thẻ liên tục khi đứng ở mép. */
const EXIT_MARGIN = 1

/**
 * Kiểm tra người chơi bước vào vùng nhận tem trước mặt tiền landmark.
 * Chỉ kích hoạt lúc bước vào (từ ngoài vào trong), không lặp lại khi đứng yên trong vùng.
 * Có vùng đệm khi ra (EXIT_MARGIN) để đứng ở mép vòng không bị bật thẻ lặp lại.
 */
export function createCheckpointTracker(zone: string) {
  const points = landmarksInZone(zone).map((l) => ({ id: l.id, at: checkpointOf(l) }))
  const inside = new Set<string>()

  return function update(x: number, z: number) {
    for (const p of points) {
      const d = Math.hypot(x - p.at[0], z - p.at[1])
      if (d <= CHECKPOINT_RADIUS && !inside.has(p.id)) {
        inside.add(p.id)
        useStampStore.getState().visit(p.id)
      } else if (d > CHECKPOINT_RADIUS + EXIT_MARGIN) {
        inside.delete(p.id)
      }
    }
  }
}
