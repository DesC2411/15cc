import { Room, type Client } from 'colyseus';
import { Player, ZoneState } from './schema/ZoneState.ts';

/** Danh sách khu hợp lệ, khớp với `zone` trong content/landmarks.json. */
export const ZONES = ['central', 'lachtray', 'doson', 'catba', 'bachdang', 'port'] as const;
export type ZoneId = (typeof ZONES)[number];

const ANIMS = new Set(['idle', 'walk', 'run', 'wave']);
/** Giới hạn toạ độ (mét) để chặn dữ liệu rác từ client. */
const WORLD_LIMIT = 500;

type MoveMessage = { x: number; y: number; z: number; rotY: number; anim: string };

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isMoveMessage(m: unknown): m is MoveMessage {
  if (typeof m !== 'object' || m === null) return false;
  const o = m as Record<string, unknown>;
  return (
    isFiniteNumber(o.x) &&
    isFiniteNumber(o.y) &&
    isFiniteNumber(o.z) &&
    isFiniteNumber(o.rotY) &&
    typeof o.anim === 'string' &&
    ANIMS.has(o.anim)
  );
}

const clamp = (v: number) => Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, v));

/**
 * Một phòng = một khu, tối đa 50 người (CLAUDE.md mục 1).
 * Giai đoạn 0: chỉ có join/leave và tin nhắn "move". Nội suy, chat, emote làm ở giai đoạn 2.
 */
export class ZoneRoom extends Room<{ state: ZoneState }> {
  maxClients = 50;
  patchRate = 50; // 20 lần/giây

  onCreate(options: { zone?: string }) {
    const zone = ZONES.includes(options.zone as ZoneId) ? (options.zone as ZoneId) : 'central';
    this.state = new ZoneState({ zone });
    this.setMetadata({ zone });

    this.onMessage('move', (client: Client, message: unknown) => {
      if (!isMoveMessage(message)) return;
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.x = clamp(message.x);
      player.y = clamp(message.y);
      player.z = clamp(message.z);
      player.rotY = message.rotY;
      player.anim = message.anim;
    });
  }

  onJoin(client: Client) {
    const spawn = new Player();
    // Rải điểm xuất hiện quanh gốc để người chơi không chồng lên nhau.
    spawn.x = (Math.random() - 0.5) * 4;
    spawn.z = (Math.random() - 0.5) * 4;
    this.state.players.set(client.sessionId, spawn);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
  }
}
