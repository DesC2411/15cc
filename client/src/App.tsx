import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { CentralScene } from './scenes/central/CentralScene'
import { NetStatusBadge } from './components/ui/NetStatusBadge'
import { joinZone } from './net/connection'

export default function App() {
  useEffect(() => joinZone('central'), [])

  return (
    <>
      <Canvas shadows="percentage" dpr={[1, 2]} camera={{ position: [0, 45, 70], fov: 50 }}>
        <CentralScene />
      </Canvas>
      <NetStatusBadge />
    </>
  )
}
