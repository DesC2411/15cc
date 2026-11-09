import { useEffect } from 'react'
import { t } from '../../../systems/i18n'
import { isVisible, useChatStore } from '../../../systems/chat'
import { useNetStore } from '../../../net/netStore'
import './chat.css'

const FEED_SIZE = 3
const NOTICE_MS = 3000

/** Nút mở chat (có số tin chưa đọc). Enter trên máy tính cũng mở chat. */
export function ChatButton() {
  const open = useChatStore((s) => s.panelOpen)
  const setOpen = useChatStore((s) => s.setPanelOpen)
  const unread = useChatStore((s) => s.unread)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)
      if (e.key === 'Enter' && !typing && !useChatStore.getState().panelOpen) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  if (open) return null
  return (
    <button type="button" className="chat-btn" onClick={() => setOpen(true)} aria-label={t('chat.open')}>
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <path
          d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"
          fill="currentColor"
        />
      </svg>
      {unread > 0 && <span className="chat-btn__badge">{unread > 9 ? '9+' : unread}</span>}
    </button>
  )
}

/** Vài tin gần nhất nổi trên màn hình khi bảng chat đang đóng, tự mờ dần. */
export function ChatFeed() {
  const open = useChatStore((s) => s.panelOpen)
  const history = useChatStore((s) => s.history)
  const blocked = useChatStore((s) => s.blocked)
  const quickOnly = useChatStore((s) => s.quickOnlyPref)
  const quickOnlyRoom = useNetStore((s) => s.quickOnly)
  const me = useNetStore((s) => s.sessionId)
  if (open) return null

  const recent = history.filter((m) => !blocked[m.from] && isVisible(m, quickOnly || quickOnlyRoom)).slice(-FEED_SIZE)
  return (
    <ul className="chat-feed" aria-hidden="true">
      {recent.map((m) => (
        <li key={`${m.from}-${m.at}`} className="chat-feed__item">
          <b>{m.from === me ? t('chat.me') : m.name}:</b> {m.kind === 'quick' ? t(`chat.quick.${m.id}`) : m.text}
        </li>
      ))}
    </ul>
  )
}

/** Thông báo ngắn từ server (bị che từ, gửi nhanh quá, đã báo cáo...). */
export function ChatNotice() {
  const notice = useChatStore((s) => s.notice)
  const clear = useChatStore((s) => s.clearNotice)

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(clear, NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice, clear])

  if (!notice) return null
  return (
    <div className="chat-notice" role="status" key={notice.at}>
      {t(`notice.${notice.code}`, { seconds: notice.seconds ?? 0 })}
    </div>
  )
}
