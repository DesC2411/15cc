import { schema, t, type SchemaType } from '@colyseus/schema';

/** Trạng thái một người chơi được đồng bộ cho mọi người trong phòng. */
export const Player = schema(
  {
    x: t.float32().default(0),
    y: t.float32().default(0),
    z: t.float32().default(0),
    rotY: t.float32().default(0),
    anim: t.string().default('idle'),
  },
  'Player',
);
export type Player = SchemaType<typeof Player>;

/** Trạng thái một khu (central, doson, ...). */
export const ZoneState = schema(
  {
    zone: t.string(),
    players: t.map(Player),
  },
  'ZoneState',
);
export type ZoneState = SchemaType<typeof ZoneState>;
