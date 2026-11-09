import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Chỉ bản dev: mở vài trạng thái cho script kiểm tra tự động (không có trong bản build).
if (import.meta.env.DEV) {
  void Promise.all([import('./net/interpolation'), import('./net/netStore'), import('./systems/chat')]).then(
    ([interp, net, chat]) => {
      Object.assign(window, { __pdpl: { samplePose: interp.samplePose, net: net.useNetStore, chat: chat.useChatStore } })
    },
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
