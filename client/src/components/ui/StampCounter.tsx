import { landmarksInZone } from '../../systems/content'
import { t } from '../../systems/i18n'
import { useStampStore } from '../../systems/stamps'
import './hud.css'

/** Số tem đã có trong khu hiện tại. */
export function StampCounter({ zone }: { zone: string }) {
  const ids = landmarksInZone(zone).map((l) => l.id)
  const have = useStampStore((s) => ids.filter((id) => id in s.collected).length)

  return (
    <div className="stamp-counter" role="status">
      <span className="stamp-counter__icon" aria-hidden="true" />
      {t('hud.stamps', { have, total: ids.length })}
    </div>
  )
}
