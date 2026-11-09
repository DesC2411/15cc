import { OrbitControls } from '@react-three/drei'
import { colors, colorOf } from '../../theme/colors'
import { landmarksInZone } from '../../systems/content'
import { RemotePlayers } from '../../components/player/RemotePlayers'

const landmarks = landmarksInZone('central')

/**
 * Khu Trung tâm, giai đoạn 0: mặt đất + khối tạm cho landmark đọc từ content/landmarks.json.
 * Camera xoay tự do tạm thời; giai đoạn 1 thay bằng camera đi theo nhân vật.
 */
export function CentralScene() {
  return (
    <>
      <color attach="background" args={['#BFE3EC']} />
      <hemisphereLight args={['#FFF4E0', '#8DB36B', 0.9]} />
      <directionalLight position={[30, 50, 20]} intensity={1.4} color="#FFE8C2" castShadow />

      {/* Mặt đất */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={colors['karst-green']} />
      </mesh>
      {/* Trục đường tạm */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[120, 8]} />
        <meshStandardMaterial color="#D9CBB0" />
      </mesh>

      {landmarks.map((l) => (
        <mesh
          key={l.id}
          position={[l.position[0], l.position[1] + l.size[1] / 2, l.position[2]]}
          rotation-y={l.rotationY}
          castShadow
          receiveShadow
        >
          <boxGeometry args={l.size} />
          <meshStandardMaterial color={colorOf(l.color)} />
        </mesh>
      ))}

      <RemotePlayers />

      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.2} minDistance={10} maxDistance={150} />
    </>
  )
}
