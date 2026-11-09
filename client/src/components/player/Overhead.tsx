import { useEffect, useState, type Ref } from 'react'
import { Html } from '@react-three/drei'
import { t } from '../../systems/i18n'
import { isVisible, useChatStore } from '../../systems/chat'
import { useNetStore } from '../../net/netStore'
import { OVERHEAD_Y } from './avatarShape'
import './Overhead.css'

interface Props {
  id: string
  name: string
  isMe?: boolean
  /** Phần tử bọc ngoài, để component cha ẩn khi ở xa. */
  wrapRef?: Ref<HTMLDivElement>
}

/** Tên và bong bóng chat / emote trên đầu nhân vật. */
export function Overhead({ id, name, isMe = false, wrapRef }: Props) {
  const bubble = useChatStore((s) => s.bubbles[id])
  const quickOnlyPref = useChatStore((s) => s.quickOnlyPref)
  const quickOnlyRoom = useNetStore((s) => s.quickOnly)
  const quickOnly = quickOnlyPref || quickOnlyRoom
  // Mốc `until` của bong bóng đã hết hạn gần nhất; bong bóng mới có mốc khác nên hiện lại.
  const [expiredUntil, setExpiredUntil] = useState(0)
  useEffect(() => {
    if (!bubble) return
    const timer = setTimeout(() => setExpiredUntil(bubble.until), Math.max(0, bubble.until - Date.now()))
    return () => clearTimeout(timer)
  }, [bubble])

  const live = bubble && bubble.until !== expiredUntil ? bubble : null
  let content: string | null = null
  let isEmote = false
  if (live?.kind === 'emote') {
    content = live.icon ?? null
    isEmote = true
  } else if (live?.msg && isVisible(live.msg, quickOnly)) {
    content = live.msg.kind === 'quick' ? t(`chat.quick.${live.msg.id}`) : live.msg.text
  }

  return (
    <Html position={[0, OVERHEAD_Y, 0]} center zIndexRange={[10, 0]} className="overhead-wrap">
      <div ref={wrapRef} className="overhead">
        {content && (
          <div className={`overhead__bubble${isEmote ? ' overhead__bubble--emote' : ''}`} key={live?.until}>
            {content}
          </div>
        )}
        <div className={`overhead__name${isMe ? ' overhead__name--me' : ''}`}>{name}</div>
      </div>
    </Html>
  )
}
