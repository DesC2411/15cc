import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Tem đã sưu tầm và Thẻ Bí Mật đang mở.
 * Tạm lưu ở localStorage của trình duyệt; sẽ chuyển sang Supabase khi có tài khoản.
 */
interface StampState {
  /** id landmark → thời điểm nhận tem (ms). */
  collected: Record<string, number>
  /** Landmark đang hiện Thẻ Bí Mật. */
  openCardId: string | null
  /** true nếu lần mở thẻ này vừa nhận tem mới. */
  openCardIsNew: boolean
  /** Bước vào vùng nhận tem: ghi tem (nếu chưa có) và mở Thẻ Bí Mật. */
  visit: (landmarkId: string) => void
  closeCard: () => void
}

function safeLocalStorage(): Storage {
  try {
    return window.localStorage
  } catch {
    // Chế độ riêng tư / bị chặn: dùng bộ nhớ tạm, tem mất khi tải lại trang.
    const mem = new Map<string, string>()
    return {
      get length() {
        return mem.size
      },
      clear: () => mem.clear(),
      getItem: (k) => mem.get(k) ?? null,
      key: (i) => [...mem.keys()][i] ?? null,
      removeItem: (k) => void mem.delete(k),
      setItem: (k, v) => void mem.set(k, v),
    }
  }
}

export const useStampStore = create<StampState>()(
  persist(
    (set, get) => ({
      collected: {},
      openCardId: null,
      openCardIsNew: false,
      visit: (id) => {
        const isNew = !(id in get().collected)
        set((s) => ({
          collected: isNew ? { ...s.collected, [id]: Date.now() } : s.collected,
          openCardId: id,
          openCardIsNew: isNew,
        }))
      },
      closeCard: () => set({ openCardId: null, openCardIsNew: false }),
    }),
    {
      name: 'pdpl-stamps-v1',
      storage: createJSONStorage(safeLocalStorage),
      partialize: (s) => ({ collected: s.collected }),
    },
  ),
)
