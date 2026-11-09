import { create } from 'zustand'

export type NetStatus = 'idle' | 'connecting' | 'connected' | 'error'

export interface RemotePlayer {
  x: number
  y: number
  z: number
  rotY: number
  anim: string
}

interface NetState {
  status: NetStatus
  zone: string
  sessionId: string | null
  players: Record<string, RemotePlayer>
  setStatus: (status: NetStatus) => void
  setSession: (zone: string, sessionId: string) => void
  setPlayers: (players: Record<string, RemotePlayer>) => void
  reset: () => void
}

export const useNetStore = create<NetState>((set) => ({
  status: 'idle',
  zone: 'central',
  sessionId: null,
  players: {},
  setStatus: (status) => set({ status }),
  setSession: (zone, sessionId) => set({ zone, sessionId }),
  setPlayers: (players) => set({ players }),
  reset: () => set({ status: 'idle', sessionId: null, players: {} }),
}))
