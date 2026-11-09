import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { CentralScene } from './scenes/central/CentralScene'
import { NetStatusBadge } from './components/ui/NetStatusBadge'
import { StampCounter } from './components/ui/StampCounter'
import { TouchControls } from './components/ui/TouchControls'
import { SecretCard } from './components/ui/SecretCard'
import { ChatPanel } from './components/ui/chat/ChatPanel'
import { ChatButton, ChatFeed, ChatNotice } from './components/ui/chat/ChatHud'
import { joinZone } from './net/connection'
import { bindKeyboard } from './systems/input'

const ZONE = 'central'

export default function App() {
  useEffect(() => joinZone(ZONE), [])
  useEffect(() => bindKeyboard(), [])

  return (
    <>
      <Canvas shadows="percentage" dpr={[1, 1.5]} camera={{ position: [0, 8, 22], fov: 55, near: 0.1, far: 400 }}>
        <Suspense fallback={null}>
          {/* timeStep "vary": bước vật lý theo khung hình, để camera và nhân vật luôn khớp nhau. */}
          <Physics timeStep="vary">
            <CentralScene />
          </Physics>
        </Suspense>
      </Canvas>
      <NetStatusBadge />
      <StampCounter zone={ZONE} />
      <TouchControls />
      <ChatFeed />
      <ChatButton />
      <ChatNotice />
      <ChatPanel />
      <SecretCard />
    </>
  )
}
