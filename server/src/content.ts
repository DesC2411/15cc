import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FilterList } from './chat/profanity.ts'

export interface ChatContent {
  guestNamePrefix: string
  quickPhrases: string[]
  emotes: { id: string; icon: string }[]
}

/**
 * Tìm thư mục content/ ở gốc dự án: đi ngược lên từ file này (chạy bằng tsx hay từ dist/ đều được).
 * Đặt CONTENT_DIR để chỉ định thẳng khi deploy.
 */
function findContentDir(): string {
  if (process.env.CONTENT_DIR) return resolve(process.env.CONTENT_DIR)
  let dir = dirname(fileURLToPath(import.meta.url))
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, 'content')
    if (existsSync(join(candidate, 'chat.json'))) return candidate
    dir = dirname(dir)
  }
  throw new Error('Không tìm thấy thư mục content/ (đặt biến môi trường CONTENT_DIR)')
}

function readJson<T>(dir: string, file: string): T {
  return JSON.parse(readFileSync(join(dir, file), 'utf8')) as T
}

export function loadContent() {
  const dir = findContentDir()
  const chat = readJson<ChatContent>(dir, 'chat.json')
  const chatFilter = readJson<FilterList>(dir, 'chat_filter.json')
  if (!Array.isArray(chat.quickPhrases) || !Array.isArray(chat.emotes)) throw new Error('content/chat.json sai cấu trúc')
  if (!Array.isArray(chatFilter.words) || !Array.isArray(chatFilter.phrases))
    throw new Error('content/chat_filter.json sai cấu trúc')
  return { dir, chat, chatFilter }
}
