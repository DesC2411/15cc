/**
 * Test tích hợp: chạy server thật trên cổng riêng, nối bằng SDK client.
 * Kiểm tra chat bị lọc, giới hạn tốc độ, khoá chat sau nhiều lần vi phạm, chế độ chỉ câu có sẵn.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { Client, type Room } from '@colyseus/sdk'
import { MSG, type ChatBroadcast, type Notice } from '../../../shared/protocol.ts'

const SERVER_DIR = fileURLToPath(new URL('../..', import.meta.url))
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function startServer(port: number, env: Record<string, string> = {}): Promise<ChildProcess> {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: SERVER_DIR,
    env: { ...process.env, PORT: String(port), ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server không khởi động')), 20000)
    child.stdout!.on('data', (d: Buffer) => {
      if (d.toString().includes('Colyseus đang chạy')) {
        clearTimeout(timer)
        resolve()
      }
    })
    child.on('exit', (code) => reject(new Error(`server thoát sớm (${code})`)))
  })
  return child
}

interface Inbox {
  chats: ChatBroadcast[]
  notices: Notice[]
}

async function join(port: number): Promise<{ room: Room; inbox: Inbox }> {
  const room = await new Client(`http://localhost:${port}`).joinOrCreate('zone', { zone: 'central' })
  const inbox: Inbox = { chats: [], notices: [] }
  room.onMessage(MSG.chat, (m: ChatBroadcast) => inbox.chats.push(m))
  room.onMessage(MSG.notice, (n: Notice) => inbox.notices.push(n))
  room.onMessage(MSG.emote, () => {})
  await sleep(300)
  return { room, inbox }
}

test('chat thường: lọc từ bậy, giới hạn tốc độ, khoá sau 3 lần vi phạm', async () => {
  const port = 2611
  const server = await startServer(port)
  try {
    const a = await join(port)
    const b = await join(port)

    const stateA = a.room.state as { players: { get(id: string): { name: string } | undefined } }
    assert.match(stateA.players.get(a.room.sessionId)?.name ?? '', /\S+ \d+/)

    a.room.send(MSG.chat, { text: 'đm Nhà hát lớn' })
    await sleep(300)
    const last = b.inbox.chats.at(-1)
    assert.equal(last?.kind, 'text')
    assert.equal(last?.kind === 'text' && last.text, '** Nhà hát lớn')
    assert.deepEqual(a.inbox.notices.at(-1), { code: 'filtered' })

    // Gửi ngay lần nữa: quá nhanh
    a.room.send(MSG.quick, { id: 'hello' })
    await sleep(300)
    assert.deepEqual(a.inbox.notices.at(-1), { code: 'rate_limited' })

    // Câu có sẵn sai id: bỏ qua, không gửi gì
    await sleep(1600)
    const before = b.inbox.chats.length
    a.room.send(MSG.quick, { id: 'khong_co' })
    await sleep(300)
    assert.equal(b.inbox.chats.length, before)

    // Vi phạm thêm 2 lần (tổng 3) → bị khoá
    a.room.send(MSG.chat, { text: 'vcl' })
    await sleep(1600)
    a.room.send(MSG.chat, { text: 'fuck' })
    await sleep(300)
    const muted = a.inbox.notices.at(-1)
    assert.equal(muted?.code, 'muted')
    assert.ok((muted?.seconds ?? 0) >= 59)

    await sleep(1600)
    const count = b.inbox.chats.length
    a.room.send(MSG.quick, { id: 'thanks' })
    await sleep(300)
    assert.equal(b.inbox.chats.length, count, 'đang bị khoá thì không được gửi')
    assert.equal(a.inbox.notices.at(-1)?.code, 'muted')

    // Người khác vẫn chat bình thường
    b.room.send(MSG.quick, { id: 'thanks' })
    await sleep(300)
    assert.deepEqual(
      a.inbox.chats.at(-1) && { kind: a.inbox.chats.at(-1)!.kind, from: a.inbox.chats.at(-1)!.from },
      { kind: 'quick', from: b.room.sessionId },
    )

    await a.room.leave()
    await b.room.leave()
  } finally {
    server.kill()
  }
})

test('phòng chỉ câu có sẵn (CHAT_QUICK_ONLY=1)', async () => {
  const port = 2612
  const server = await startServer(port, { CHAT_QUICK_ONLY: '1' })
  try {
    const a = await join(port)
    assert.equal((a.room.state as { quickOnly: boolean }).quickOnly, true)

    a.room.send(MSG.chat, { text: 'xin chào' })
    await sleep(300)
    assert.deepEqual(a.inbox.notices.at(-1), { code: 'quick_only' })
    assert.equal(a.inbox.chats.length, 0)

    a.room.send(MSG.quick, { id: 'hello' })
    await sleep(300)
    assert.equal(a.inbox.chats.at(-1)?.kind, 'quick')
    await a.room.leave()
  } finally {
    server.kill()
  }
})
