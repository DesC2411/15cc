import type { Anim } from '@shared/protocol'

/** Kích thước capsule tạm: cao 1,8 m (CLAUDE.md mục 3.3: 1 unit = 1 m). */
export const AVATAR_RADIUS = 0.4
export const AVATAR_HALF_HEIGHT = 0.5
export const AVATAR_CENTER_Y = AVATAR_HALF_HEIGHT + AVATAR_RADIUS
/** Độ cao đặt nhãn tên / bong bóng trên đầu. */
export const OVERHEAD_Y = AVATAR_CENTER_Y * 2 + 0.5

const BOB = { idle: [0, 0], walk: [0.06, 10], run: [0.11, 14] } as const satisfies Record<Anim, readonly [number, number]>

/** Nhún lên xuống theo trạng thái (thay cho animation thật cho tới khi có model .glb). */
export function bobOffset(anim: Anim, time: number): number {
  const [amp, freq] = BOB[anim]
  return Math.abs(Math.sin(time * freq)) * amp
}
