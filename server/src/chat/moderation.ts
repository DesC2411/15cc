import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHAT_MIN_INTERVAL_MS, EMOTE_MIN_INTERVAL_MS, type ReportReason } from '../../../shared/protocol.ts';

/** Bị che từ 3 lần trong 60 giây thì khoá chat 60 giây. */
const STRIKE_LIMIT = 3;
const STRIKE_WINDOW_MS = 60_000;
const MUTE_MS = 60_000;
/** Giữ vài tin gần nhất của mỗi người để đính kèm khi bị báo cáo. */
const RECENT_KEEP = 5;

interface ChatterState {
  lastChatAt: number;
  lastEmoteAt: number;
  strikes: number[];
  mutedUntil: number;
  recent: string[];
}

export type ChatCheck = { ok: true } | { ok: false; code: 'rate_limited' } | { ok: false; code: 'muted'; seconds: number };

/** Trạng thái kiểm duyệt chat của một phòng. */
export class Moderation {
  private chatters = new Map<string, ChatterState>();

  private get(id: string): ChatterState {
    let s = this.chatters.get(id);
    if (!s) {
      s = { lastChatAt: 0, lastEmoteAt: 0, strikes: [], mutedUntil: 0, recent: [] };
      this.chatters.set(id, s);
    }
    return s;
  }

  /** Kiểm tra được phép gửi chat chưa; nếu được thì ghi nhận thời điểm gửi. */
  canChat(id: string, now = Date.now()): ChatCheck {
    const s = this.get(id);
    if (now < s.mutedUntil) return { ok: false, code: 'muted', seconds: Math.ceil((s.mutedUntil - now) / 1000) };
    if (now - s.lastChatAt < CHAT_MIN_INTERVAL_MS) return { ok: false, code: 'rate_limited' };
    s.lastChatAt = now;
    return { ok: true };
  }

  canEmote(id: string, now = Date.now()): boolean {
    const s = this.get(id);
    if (now - s.lastEmoteAt < EMOTE_MIN_INTERVAL_MS) return false;
    s.lastEmoteAt = now;
    return true;
  }

  /** Ghi một lần bị che từ. Trả về số giây bị khoá nếu vừa vượt ngưỡng. */
  strike(id: string, now = Date.now()): number {
    const s = this.get(id);
    s.strikes = s.strikes.filter((t) => now - t < STRIKE_WINDOW_MS);
    s.strikes.push(now);
    if (s.strikes.length >= STRIKE_LIMIT) {
      s.strikes = [];
      s.mutedUntil = now + MUTE_MS;
      return MUTE_MS / 1000;
    }
    return 0;
  }

  remember(id: string, line: string) {
    const s = this.get(id);
    s.recent.push(line);
    if (s.recent.length > RECENT_KEEP) s.recent.shift();
  }

  recent(id: string): string[] {
    return [...(this.chatters.get(id)?.recent ?? [])];
  }

  forget(id: string) {
    this.chatters.delete(id);
  }
}

const REPORT_FILE = process.env.REPORT_FILE || join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'logs', 'reports.jsonl');

export interface ReportEntry {
  at: string;
  zone: string;
  roomId: string;
  reporter: { id: string; name: string };
  target: { id: string; name: string };
  reason: ReportReason;
  /** Các tin gần nhất của người bị báo cáo (đã qua lọc). */
  recent: string[];
}

/**
 * Lưu báo cáo vào server/logs/reports.jsonl (mỗi dòng một JSON) để người quản lý xem lại.
 * Khi có Supabase sẽ chuyển sang bảng riêng.
 */
export async function saveReport(entry: ReportEntry) {
  await mkdir(dirname(REPORT_FILE), { recursive: true });
  await appendFile(REPORT_FILE, JSON.stringify(entry) + '\n', 'utf8');
}
