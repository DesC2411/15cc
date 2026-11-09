import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CHAT_MAX_LENGTH, type ChatBroadcast } from '@shared/protocol'
import { t } from '../../../systems/i18n'
import { EMOTES, QUICK_PHRASES, isVisible, useChatStore } from '../../../systems/chat'
import { useNetStore } from '../../../net/netStore'
import { sendChat, sendEmote, sendQuick, sendReport } from '../../../net/connection'
import './chat.css'

function messageText(m: ChatBroadcast) {
  return m.kind === 'quick' ? t(`chat.quick.${m.id}`) : m.text
}

/** Một dòng trong lịch sử; người khác có nút ⋯ để chặn / báo cáo. */
function HistoryRow({ m, me }: { m: ChatBroadcast; me: string | null }) {
  const [menu, setMenu] = useState(false)
  const blocked = useChatStore((s) => !!s.blocked[m.from])
  const toggleBlock = useChatStore((s) => s.toggleBlock)
  const isMine = m.from === me

  return (
    <li className={`chat-row${isMine ? ' chat-row--me' : ''}`}>
      <div className="chat-row__line">
        <span className="chat-row__name">{isMine ? t('chat.me') : m.name}</span>
        <span className="chat-row__text">{messageText(m)}</span>
        {!isMine && (
          <button
            type="button"
            className="chat-row__more"
            aria-label={t('chat.more', { name: m.name })}
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
          >
            ⋯
          </button>
        )}
      </div>
      {menu && (
        <div className="chat-row__menu">
          <button
            type="button"
            className="chip"
            onClick={() => {
              toggleBlock(m.from)
              setMenu(false)
            }}
          >
            {blocked ? t('chat.unblock') : t('chat.block')}
          </button>
          <button
            type="button"
            className="chip chip--danger"
            onClick={() => {
              sendReport(m.from, 'abuse')
              setMenu(false)
            }}
          >
            {t('chat.report')}
          </button>
        </div>
      )}
    </li>
  )
}

export function ChatPanel() {
  const open = useChatStore((s) => s.panelOpen)
  const setOpen = useChatStore((s) => s.setPanelOpen)
  const history = useChatStore((s) => s.history)
  const blocked = useChatStore((s) => s.blocked)
  const quickOnlyPref = useChatStore((s) => s.quickOnlyPref)
  const setQuickOnlyPref = useChatStore((s) => s.setQuickOnlyPref)
  const quickOnlyRoom = useNetStore((s) => s.quickOnly)
  const me = useNetStore((s) => s.sessionId)
  const quickOnly = quickOnlyPref || quickOnlyRoom

  const [text, setText] = useState('')
  const list = useRef<HTMLUListElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const visible = history.filter((m) => !blocked[m.from] && isVisible(m, quickOnly))

  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight
  }, [visible.length, open])

  // Máy tính: focus ô nhập ngay. Điện thoại: không, để bàn phím ảo không che câu có sẵn.
  useEffect(() => {
    if (open && window.matchMedia('(pointer: fine)').matches) input.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    sendChat(value)
    setText('')
  }

  return (
    <div className="chat-panel" role="dialog" aria-label={t('chat.title')}>
      <div className="chat-panel__head">
        <h2 className="chat-panel__title">{t('chat.title')}</h2>
        <button type="button" className="chat-panel__close" onClick={() => setOpen(false)} aria-label={t('chat.close')}>
          ×
        </button>
      </div>

      <ul ref={list} className="chat-panel__history" aria-live="polite">
        {visible.length === 0 && <li className="chat-panel__empty">{t('chat.empty')}</li>}
        {visible.map((m) => (
          <HistoryRow key={`${m.from}-${m.at}`} m={m} me={me} />
        ))}
      </ul>

      <div className="chat-panel__section" role="group" aria-label={t('chat.emoteTitle')}>
        <div className="chat-panel__emotes">
          {EMOTES.map((e) => (
            <button
              key={e.id}
              type="button"
              className="emote-btn"
              aria-label={t(`chat.emote.${e.id}`)}
              title={t(`chat.emote.${e.id}`)}
              onClick={() => sendEmote(e.id)}
            >
              {e.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-panel__section" role="group" aria-label={t('chat.quickTitle')}>
        <div className="chat-panel__quick">
          {QUICK_PHRASES.map((id) => (
            <button key={id} type="button" className="chip" onClick={() => sendQuick(id)}>
              {t(`chat.quick.${id}`)}
            </button>
          ))}
        </div>
      </div>

      {quickOnlyRoom ? (
        <p className="chat-panel__note">{t('chat.quickOnlyRoom')}</p>
      ) : (
        <>
          {!quickOnlyPref && (
            <form className="chat-panel__form" onSubmit={submit}>
              <input
                ref={input}
                className="chat-panel__input"
                value={text}
                maxLength={CHAT_MAX_LENGTH}
                placeholder={t('chat.placeholder')}
                enterKeyHint="send"
                autoComplete="off"
                onChange={(e) => setText(e.target.value)}
              />
              <button type="submit" className="btn btn--primary chat-panel__send" disabled={!text.trim()}>
                {t('chat.send')}
              </button>
            </form>
          )}
          <label className="chat-panel__toggle">
            <input type="checkbox" checked={quickOnlyPref} onChange={(e) => setQuickOnlyPref(e.target.checked)} />
            {t('chat.quickOnlyToggle')}
          </label>
        </>
      )}
    </div>
  )
}
