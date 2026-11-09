/**
 * Giao thức tin nhắn giữa client và server, dùng chung cho cả hai phía.
 * Chỉ chứa kiểu và hằng số, không import thư viện nào.
 */

export const ANIMS = ['idle', 'walk', 'run'] as const
export type Anim = (typeof ANIMS)[number]

/** Client gửi vị trí tối đa 10 lần/giây. */
export const MOVE_SEND_INTERVAL_MS = 100
/** Số màu nhân vật tạm (client ánh xạ sang bảng màu). */
export const LOOK_COUNT = 7

export const CHAT_MAX_LENGTH = 120
/** Khoảng cách tối thiểu giữa 2 tin chat (cả câu có sẵn). */
export const CHAT_MIN_INTERVAL_MS = 1500
export const EMOTE_MIN_INTERVAL_MS = 1000

export const REPORT_REASONS = ['abuse', 'spam', 'other'] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

/** Tên tin nhắn. */
export const MSG = {
  move: 'move',
  chat: 'chat',
  quick: 'quick',
  emote: 'emote',
  report: 'report',
  notice: 'notice',
} as const

// ---------- client → server ----------
export interface MoveRequest {
  x: number
  y: number
  z: number
  rotY: number
  anim: Anim
}
export interface ChatRequest {
  text: string
}
export interface QuickRequest {
  id: string
}
export interface EmoteRequest {
  id: string
}
export interface ReportRequest {
  target: string
  reason: ReportReason
}

// ---------- server → client ----------
export type ChatBroadcast =
  | { from: string; name: string; at: number; kind: 'text'; text: string }
  | { from: string; name: string; at: number; kind: 'quick'; id: string }

export interface EmoteBroadcast {
  from: string
  id: string
}

export type NoticeCode = 'rate_limited' | 'muted' | 'filtered' | 'reported' | 'quick_only' | 'too_long'
export interface Notice {
  code: NoticeCode
  seconds?: number
}
