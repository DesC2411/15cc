import { Room, type Client } from 'colyseus';
import { Player, ZoneState } from './schema/ZoneState.ts';
import {
  ANIMS,
  CHAT_MAX_LENGTH,
  LOOK_COUNT,
  MSG,
  REPORT_REASONS,
  type Anim,
  type ChatBroadcast,
  type EmoteBroadcast,
  type MoveRequest,
  type Notice,
  type ReportReason,
} from '../../../shared/protocol.ts';
import { loadContent } from '../content.ts';
import { createFilter, sanitize } from '../chat/profanity.ts';
import { Moderation, saveReport } from '../chat/moderation.ts';

/** Danh sách khu hợp lệ, khớp với `zone` trong content/landmarks.json. */
export const ZONES = ['central', 'lachtray', 'doson', 'catba', 'bachdang', 'port'] as const;
export type ZoneId = (typeof ZONES)[number];

/** Giới hạn toạ độ (mét) để chặn dữ liệu rác từ client. */
const WORLD_LIMIT = 500;

const content = loadContent();
const filter = createFilter(content.chatFilter);
const QUICK_IDS = new Set(content.chat.quickPhrases);
const EMOTE_IDS = new Set(content.chat.emotes.map((e) => e.id));
const QUICK_ONLY = process.env.CHAT_QUICK_ONLY === '1';

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isObject = (m: unknown): m is Record<string, unknown> => typeof m === 'object' && m !== null;
const clamp = (v: number) => Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, v));

function isMoveRequest(m: unknown): m is MoveRequest {
  return (
    isObject(m) &&
    isFiniteNumber(m.x) &&
    isFiniteNumber(m.y) &&
    isFiniteNumber(m.z) &&
    isFiniteNumber(m.rotY) &&
    ANIMS.includes(m.anim as Anim)
  );
}

const stringField = (m: unknown, key: string): string | null =>
  isObject(m) && typeof m[key] === 'string' ? (m[key] as string) : null;

/**
 * Một phòng = một khu, tối đa 50 người (CLAUDE.md mục 1).
 * Đồng bộ vị trí/hướng/animation, chat có lọc từ bậy, câu chat có sẵn, emote, báo cáo.
 */
export class ZoneRoom extends Room<{ state: ZoneState }> {
  maxClients = 50;
  patchRate = 50; // 20 lần/giây

  private mod = new Moderation();

  onCreate(options: { zone?: string }) {
    const zone = ZONES.includes(options.zone as ZoneId) ? (options.zone as ZoneId) : 'central';
    this.state = new ZoneState({ zone, quickOnly: QUICK_ONLY });
    this.setMetadata({ zone });

    this.onMessage(MSG.move, (client: Client, message: unknown) => {
      if (!isMoveRequest(message)) return;
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.x = clamp(message.x);
      player.y = clamp(message.y);
      player.z = clamp(message.z);
      player.rotY = Math.atan2(Math.sin(message.rotY), Math.cos(message.rotY));
      player.anim = message.anim;
    });

    this.onMessage(MSG.chat, (client: Client, message: unknown) => {
      const raw = stringField(message, 'text');
      if (raw === null) return;
      if (this.state.quickOnly) return this.notice(client, { code: 'quick_only' });
      const text = sanitize(raw);
      if (!text) return;
      if ([...text].length > CHAT_MAX_LENGTH) return this.notice(client, { code: 'too_long' });
      if (!this.allowChat(client)) return;

      const result = filter(text);
      if (result.flagged) {
        const muted = this.mod.strike(client.sessionId);
        this.notice(client, muted ? { code: 'muted', seconds: muted } : { code: 'filtered' });
      }
      this.mod.remember(client.sessionId, result.text);
      this.broadcastChat(client, { kind: 'text', text: result.text });
    });

    this.onMessage(MSG.quick, (client: Client, message: unknown) => {
      const id = stringField(message, 'id');
      if (id === null || !QUICK_IDS.has(id)) return;
      if (!this.allowChat(client)) return;
      this.mod.remember(client.sessionId, `[quick:${id}]`);
      this.broadcastChat(client, { kind: 'quick', id });
    });

    this.onMessage(MSG.emote, (client: Client, message: unknown) => {
      const id = stringField(message, 'id');
      if (id === null || !EMOTE_IDS.has(id)) return;
      if (!this.mod.canEmote(client.sessionId)) return;
      const msg: EmoteBroadcast = { from: client.sessionId, id };
      this.broadcast(MSG.emote, msg);
    });

    this.onMessage(MSG.report, (client: Client, message: unknown) => {
      const target = stringField(message, 'target');
      const reason = stringField(message, 'reason') as ReportReason | null;
      if (!target || target === client.sessionId || !reason || !REPORT_REASONS.includes(reason)) return;
      const targetPlayer = this.state.players.get(target);
      const reporter = this.state.players.get(client.sessionId);
      if (!targetPlayer || !reporter) return;
      saveReport({
        at: new Date().toISOString(),
        zone: this.state.zone,
        roomId: this.roomId,
        reporter: { id: client.sessionId, name: reporter.name },
        target: { id: target, name: targetPlayer.name },
        reason,
        recent: this.mod.recent(target),
      }).catch((err: unknown) => console.error('[report] không ghi được báo cáo', err));
      console.log(`[report] ${reporter.name} báo cáo ${targetPlayer.name} (${reason}) ở ${this.state.zone}`);
      this.notice(client, { code: 'reported' });
    });
  }

  private notice(client: Client, notice: Notice) {
    client.send(MSG.notice, notice);
  }

  private allowChat(client: Client): boolean {
    const check = this.mod.canChat(client.sessionId);
    if (check.ok) return true;
    this.notice(client, check.code === 'muted' ? { code: 'muted', seconds: check.seconds } : { code: 'rate_limited' });
    return false;
  }

  private broadcastChat(client: Client, body: { kind: 'text'; text: string } | { kind: 'quick'; id: string }) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    const msg: ChatBroadcast = { from: client.sessionId, name: player.name, at: Date.now(), ...body };
    this.broadcast(MSG.chat, msg);
  }

  /** Tên tạm "Lữ khách 123", không trùng trong phòng. */
  private guestName(): string {
    const taken = new Set<string>();
    this.state.players.forEach((p) => taken.add(p.name));
    for (let i = 0; i < 50; i++) {
      const name = `${content.chat.guestNamePrefix} ${100 + Math.floor(Math.random() * 900)}`;
      if (!taken.has(name)) return name;
    }
    return `${content.chat.guestNamePrefix} ${Date.now() % 100000}`;
  }

  onJoin(client: Client) {
    const player = new Player();
    // Rải điểm xuất hiện quanh gốc để người chơi không chồng lên nhau.
    player.x = (Math.random() - 0.5) * 4;
    player.z = (Math.random() - 0.5) * 4;
    player.name = this.guestName();
    player.look = Math.floor(Math.random() * LOOK_COUNT);
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    this.mod.forget(client.sessionId);
  }
}
