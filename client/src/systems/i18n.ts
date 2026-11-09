import vi from '@content/i18n/vi.json'

type Dict = Record<string, string>

const dicts: Record<string, Dict> = { vi }
let current: Dict = vi

export function setLocale(locale: string) {
  current = dicts[locale] ?? vi
}

/** Lấy chữ hiển thị theo khoá, thay {tham_so}. Thiếu khoá thì trả về chính khoá để dễ phát hiện. */
export function t(key: string, params?: Record<string, string | number>): string {
  const raw = current[key] ?? key
  if (!params) return raw
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`))
}
