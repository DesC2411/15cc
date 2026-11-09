import { useMemo } from 'react'
import { landmarksInZone, treePositions, zoneLayout } from '../../systems/content'
import { ZoneGround } from '../../components/world/ZoneGround'
import { Landmarks } from '../../components/world/Landmarks'
import { FlamboyantTrees } from '../../components/world/FlamboyantTrees'
import { SunLight } from '../../components/world/SunLight'
import { LocalPlayer } from '../../components/player/LocalPlayer'
import { CameraDrag } from '../../components/player/CameraDrag'
import { RemotePlayers } from '../../components/player/RemotePlayers'

const ZONE = 'central'
const landmarks = landmarksInZone(ZONE)
const layout = zoneLayout(ZONE)

/**
 * Khu Trung tâm, giai đoạn 1 (grey-box): mặt đất, đường, landmark, hàng phượng đọc từ content/.
 * Phải nằm trong <Physics> vì dùng collider Rapier.
 */
export function CentralScene() {
  const trees = useMemo(() => treePositions(layout), [])

  return (
    <>
      <color attach="background" args={['#BFE3EC']} />
      <fog attach="fog" args={['#BFE3EC', 90, 180]} />
      <hemisphereLight args={['#FFF4E0', '#8DB36B', 0.9]} />
      <SunLight />

      <ZoneGround layout={layout} />
      <Landmarks items={landmarks} />
      <FlamboyantTrees positions={trees} />

      <LocalPlayer zone={ZONE} spawn={layout.spawn} />
      <CameraDrag />
      <RemotePlayers />
    </>
  )
}
