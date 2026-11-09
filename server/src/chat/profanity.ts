/**
 * Lọc từ bậy trong chat (CLAUDE.md mục 3.5). So khớp nguyên từ / cụm từ, thay bằng dấu *.
 * Danh sách nằm ở content/chat_filter.json; cách chuẩn hoá mô tả trong trường _note của file đó.
 */

export interface FilterList {
  words: string[]
  phrases: string[]
}

export interface FilterResult {
  text: string
  /** Có ít nhất một từ bị che. */
  flagged: boolean
}

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '@': 'a', $: 's' }
/** Ký tự hay bị chèn vào giữa từ để lách lọc: đ.m, đ*t, v_c_l, f!ck. */
const INNER = /[.*_\-!]/g
/** Một "từ" gồm chữ, số và các ký tự chèn/leet ở trên. */
const TOKEN = /[\p{L}\p{M}\p{N}@$.*_\-!]+/gu
const EDGE_START = /^[.*_\-!]+/
const EDGE_END = /[.*_\-!]+$/

function base(token: string): string {
  return token
    .normalize('NFC')
    .toLowerCase()
    .replace(INNER, '')
    .replace(/[0134@$]/g, (c) => LEET[c] ?? c)
}

/** Gộp chữ lặp liên tiếp: "vcllll" → "vcl". */
function collapse(s: string): string {
  return [...s].filter((c, i, arr) => i === 0 || c !== arr[i - 1]).join('')
}

export function createFilter(list: FilterList) {
  const exact = new Set<string>()
  const collapsed = new Set<string>()
  const addWord = (w: string) => {
    const b = base(w)
    exact.add(b)
    // Chỉ so dạng đã gộp khi còn ≥ 2 ký tự, tránh "cc" → "c" làm che nhầm chữ "c".
    const c = collapse(b)
    if ([...c].length >= 2) collapsed.add(c)
  }
  list.words.forEach(addWord)

  const phrases = list.phrases.map((p) => p.split(/\s+/).filter(Boolean).map(base))
  const maxPhrase = Math.max(1, ...phrases.map((p) => p.length))
  const phraseSet = new Set(phrases.map((p) => p.join(' ')))

  const isBadWord = (key: string) => key.length > 0 && (exact.has(key) || collapsed.has(collapse(key)))

  return function filter(text: string): FilterResult {
    const tokens = [...text.normalize('NFC').matchAll(TOKEN)]
      .map((m) => {
        // Dấu câu ở đầu/cuối ("chó!", "...vcl") không thuộc phần bị che.
        const lead = m[0].length - m[0].replace(EDGE_START, '').length
        const trail = m[0].length - m[0].replace(EDGE_END, '').length
        const start = m.index + lead
        const end = Math.max(start, m.index + m[0].length - trail)
        return { start, end, key: base(text.normalize('NFC').slice(start, end)) }
      })
      .filter((t) => t.end > t.start)
    const masked = new Array<boolean>(tokens.length).fill(false)

    tokens.forEach((t, i) => {
      if (isBadWord(t.key)) masked[i] = true
      for (let n = 2; n <= maxPhrase && i + n <= tokens.length; n++) {
        const key = tokens
          .slice(i, i + n)
          .map((x) => x.key)
          .join(' ')
        if (phraseSet.has(key)) masked.fill(true, i, i + n)
      }
    })

    if (!masked.includes(true)) return { text, flagged: false }
    let out = ''
    let last = 0
    const src = text.normalize('NFC')
    tokens.forEach((t, i) => {
      if (!masked[i]) return
      out += src.slice(last, t.start) + '*'.repeat([...src.slice(t.start, t.end)].length)
      last = t.end
    })
    return { text: out + src.slice(last), flagged: true }
  }
}

/** Gọn khoảng trắng, bỏ ký tự điều khiển / ký tự vô hình hay dùng để lách lọc. */
export function sanitize(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[\p{Cc}\p{Cf}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}
