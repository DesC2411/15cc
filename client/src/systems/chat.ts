import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ChatBroadcast, NoticeCode } from '@shared/protocol'
import chatData from '@content/chat.json'

export const QUICK_PHRASES: string[] = chatData.quickPhrases
export const EMOTES: { id: string; icon: string }[] = chatData.emotes
export const emoteIcon = (id: string) => EMOTES.find((e) => e.id === id)?.icon ?? ''

/** Bong bóng trên đầu: chữ chat hoặc emote. */
export interface Bubble {
  kind: 'chat' | 'emote'
  msg?: ChatBroadcast
  icon?: string
  until: number
}

const BUBBLE_CHAT_MS = 5000
const BUBBLE_EMOTE_MS = 2500
const HISTORY_MAX = 60

interface ChatState {
  history: ChatBroadcast[]
  bubbles: Record<string, Bubble>
  /** Người chơi bị mình chặn (theo phiên, chưa có tài khoản). */
  blocked: Record<string, true>
  /** Chỉ dùng câu có sẵn: không gửi, không xem chữ tự gõ (lưu trên máy). */
  quickOnlyPref: boolean
  panelOpen: boolean
  notice: { code: NoticeCode; seconds?: number; at: number } | null
  /** Số tin mới khi bảng chat đang đóng. */
  unread: number

  receive: (msg: ChatBroadcast, isMine: boolean) => void
  emote: (from: string, id: string) => void
  setNotice: (code: NoticeCode, seconds?: number) => void
  clearNotice: () => void
  toggleBlock: (id: string) => void
  setQuickOnlyPref: (v: boolean) => void
  setPanelOpen: (v: boolean) => void
  forgetPlayer: (id: string) => void
  reset: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      history: [],
      bubbles: {},
      blocked: {},
      quickOnlyPref: false,
      panelOpen: false,
      notice: null,
      unread: 0,

      receive: (msg, isMine) => {
        const s = get()
        if (s.blocked[msg.from]) return
        set({
          history: [...s.history, msg].slice(-HISTORY_MAX),
          bubbles: { ...s.bubbles, [msg.from]: { kind: 'chat', msg, until: Date.now() + BUBBLE_CHAT_MS } },
          unread: s.panelOpen || isMine || !isVisible(msg, s.quickOnlyPref) ? s.unread : s.unread + 1,
        })
      },
      emote: (from, id) => {
        if (get().blocked[from]) return
        set((s) => ({
          bubbles: { ...s.bubbles, [from]: { kind: 'emote', icon: emoteIcon(id), until: Date.now() + BUBBLE_EMOTE_MS } },
        }))
      },
      setNotice: (code, seconds) => set({ notice: { code, seconds, at: Date.now() } }),
      clearNotice: () => set({ notice: null }),
      toggleBlock: (id) =>
        set((s) => {
          const blocked = { ...s.blocked }
          if (blocked[id]) delete blocked[id]
          else blocked[id] = true
          const bubbles = { ...s.bubbles }
          delete bubbles[id]
          return { blocked, bubbles }
        }),
      setQuickOnlyPref: (quickOnlyPref) => set({ quickOnlyPref }),
      setPanelOpen: (panelOpen) => set(panelOpen ? { panelOpen, unread: 0 } : { panelOpen }),
      forgetPlayer: (id) =>
        set((s) => {
          if (!s.bubbles[id]) return s
          const bubbles = { ...s.bubbles }
          delete bubbles[id]
          return { bubbles }
        }),
      reset: () => set({ history: [], bubbles: {}, blocked: {}, unread: 0, notice: null }),
    }),
    {
      name: 'pdpl-chat-v1',
      storage: createJSONStorage(() => {
        try {
          return window.localStorage
        } catch {
          return sessionStorageFallback
        }
      }),
      partialize: (s) => ({ quickOnlyPref: s.quickOnlyPref }),
    },
  ),
)

const mem = new Map<string, string>()
const sessionStorageFallback: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => void mem.set(k, v),
  removeItem: (k) => void mem.delete(k),
}

/** Tin này có được hiện cho mình không (tôn trọng chế độ chỉ câu có sẵn). */
export function isVisible(msg: ChatBroadcast, quickOnly: boolean): boolean {
  return msg.kind === 'quick' || !quickOnly
}
