/**
 * Trạng thái điều khiển dùng chung (không đi qua React để tránh render lại mỗi khung hình).
 * Bàn phím (WASD / mũi tên, Shift chạy, Space nhảy) và joystick ảo cùng ghi vào đây,
 * nhân vật đọc ra trong useFrame.
 */
export const input = {
  /** Joystick ảo: x sang phải, y tiến lên, độ dài ≤ 1. */
  joyX: 0,
  joyY: 0,
  /** Có yêu cầu nhảy chưa xử lý (nhân vật đọc rồi đặt lại false). */
  jumpQueued: false,
}

/** Góc camera quanh nhân vật, chỉnh bằng kéo màn hình / con lăn chuột. */
export const cameraControl = {
  yaw: 0,
  pitch: 0.42,
  distance: 11,
}

export const CAMERA_LIMITS = { minPitch: 0.12, maxPitch: 1.2, minDistance: 5, maxDistance: 24 }

/** Đẩy joystick quá ngưỡng này thì chạy. */
const JOY_RUN_THRESHOLD = 0.9

const keys = new Set<string>()

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
}

/** Gắn sự kiện bàn phím. Trả về hàm gỡ (dùng làm cleanup của useEffect). */
export function bindKeyboard(): () => void {
  const down = (e: KeyboardEvent) => {
    if (isTyping(e.target)) return
    keys.add(e.code)
    if (e.code === 'Space') {
      input.jumpQueued = true
      e.preventDefault()
    }
  }
  const up = (e: KeyboardEvent) => keys.delete(e.code)
  const clear = () => keys.clear()
  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)
  window.addEventListener('blur', clear)
  return () => {
    window.removeEventListener('keydown', down)
    window.removeEventListener('keyup', up)
    window.removeEventListener('blur', clear)
    keys.clear()
  }
}

const pressed = (...codes: string[]) => codes.some((c) => keys.has(c))

/** Hướng di chuyển hiện tại (x phải, y tiến), độ dài ≤ 1, và có đang chạy không. */
export function readMove(): { x: number; y: number; run: boolean } {
  let x = (pressed('KeyD', 'ArrowRight') ? 1 : 0) - (pressed('KeyA', 'ArrowLeft') ? 1 : 0)
  let y = (pressed('KeyW', 'ArrowUp') ? 1 : 0) - (pressed('KeyS', 'ArrowDown') ? 1 : 0)
  let run = pressed('ShiftLeft', 'ShiftRight')

  if (x === 0 && y === 0) {
    x = input.joyX
    y = input.joyY
    run = Math.hypot(x, y) >= JOY_RUN_THRESHOLD
  }
  const len = Math.hypot(x, y)
  if (len > 1) {
    x /= len
    y /= len
  }
  return { x, y, run }
}
