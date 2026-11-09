import { t } from '../../systems/i18n'
import { useNetStore } from '../../net/netStore'
import './NetStatusBadge.css'

export function NetStatusBadge() {
  const status = useNetStore((s) => s.status)
  const zone = useNetStore((s) => s.zone)
  const count = useNetStore((s) => Object.keys(s.players).length)

  let text = t('net.connecting')
  if (status === 'connected') text = t('net.connected', { zone: t(`zone.${zone}`), count })
  if (status === 'error') text = t('net.error')

  return (
    <div className={`net-badge net-badge--${status}`} role="status">
      {text}
    </div>
  )
}
