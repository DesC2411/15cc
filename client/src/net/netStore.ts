import { create } from 'zustand'

export type NetStatus = 'idle' | 'connecting' | 'connected' | 'error'

/** Phần ít thay đổi của người chơi (tên, màu). Vị trí đi qua net/interpolation.ts, không qua React. */
export interface PlayerInfo {
  name: string
  look: number
}

interface NetState {
  status: NetStatus
  zone: string
  sessionId: string | null
  players: Record<string, PlayerInfo>
  /** Phòng chỉ cho dùng câu chat có sẵn. */
  quickOnly: boolean
  setStatus: (status: NetStatus) => void
  setSession: (zone: string, sessionId: string) => void
  setPlayers: (players: Record<string, PlayerInfo>) => void
  setQuickOnly: (quickOnly: boolean) => void
  reset: () => void
}

export const useNetStore = create<NetState>((set) => ({
  status: 'idle',
  zone: 'central',
  sessionId: null,
  players: {},
  quickOnly: false,
  setStatus: (status) => set({ status }),
  setSession: (zone, sessionId) => set({ zone, sessionId }),
  setPlayers: (players) => set({ players }),
  setQuickOnly: (quickOnly) => set({ quickOnly }),
  reset: () => set({ status: 'idle', sessionId: null, players: {}, quickOnly: false }),
}))
