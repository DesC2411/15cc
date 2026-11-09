import { useEffect } from 'react'
import { canShowSecret, landmarks } from '../../systems/content'
import { t } from '../../systems/i18n'
import { useStampStore } from '../../systems/stamps'
import './hud.css'

/** Thẻ Bí Mật hiện khi bước vào vùng nhận tem: tem mới, "Có thể bạn chưa biết", Chỉ đường, Đặt tour. */
export function SecretCard() {
  const id = useStampStore((s) => s.openCardId)
  const isNew = useStampStore((s) => s.openCardIsNew)
  const close = useStampStore((s) => s.closeCard)
  const l = landmarks.find((x) => x.id === id)

  useEffect(() => {
    if (!l) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [l, close])

  if (!l) return null
  const showSecret = canShowSecret(l)

  return (
    <div className="secret-card" role="dialog" aria-modal="false" aria-labelledby="secret-card-title">
      <button type="button" className="secret-card__close" onClick={close} aria-label={t('card.close')}>
        ×
      </button>

      {isNew && <div className="secret-card__new">{t('card.newStamp')}</div>}
      <h2 id="secret-card-title" className="secret-card__title">
        {l.name}
      </h2>

      <h3 className="secret-card__heading">{t('card.didYouKnow')}</h3>
      <p className="secret-card__text">{showSecret ? l.secret : t('card.secretPending')}</p>
      {showSecret && !l.verified && <p className="secret-card__draft">{t('card.draftWarning')}</p>}

      <div className="secret-card__actions">
        <a className="btn btn--primary" href={l.mapsUrl} target="_blank" rel="noopener noreferrer">
          {t('card.directions')}
        </a>
        <button type="button" className="btn btn--stacked" disabled>
          {t('card.bookTour')}
          <small>{t('card.comingSoon')}</small>
        </button>
      </div>
    </div>
  )
}
