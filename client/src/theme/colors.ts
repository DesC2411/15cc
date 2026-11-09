/** Bảng màu dùng cho 3D (CLAUDE.md mục 3.2). Giữ đồng bộ với biến CSS trong index.css. */
export const colors = {
  'phuong-red': '#E8453C',
  'phuong-red-dark': '#B8302A',
  'sun-yellow': '#F4C95D',
  'colonial-cream': '#F3E3C3',
  'brick-red': '#A9553F',
  'sea-teal': '#2A9D8F',
  'bay-blue': '#4FB0C6',
  'karst-green': '#5E8C4A',
  'langur-orange': '#F28C28',
  'langur-black': '#2B2B2B',
  'ui-bg': '#FFF8F0',
} as const

export type ColorToken = keyof typeof colors

export function colorOf(token: string): string {
  return token in colors ? colors[token as ColorToken] : colors['langur-black']
}

/** Màu nhân vật tạm theo `look` server gán (LOOK_COUNT = 7 trong shared/protocol.ts). */
const LOOK_TOKENS: ColorToken[] = [
  'phuong-red',
  'langur-orange',
  'sea-teal',
  'bay-blue',
  'sun-yellow',
  'brick-red',
  'langur-black',
]

export function lookColor(look: number): string {
  return colors[LOOK_TOKENS[look % LOOK_TOKENS.length] ?? 'phuong-red']
}
