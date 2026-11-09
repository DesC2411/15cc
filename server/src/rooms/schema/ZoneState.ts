import { schema, t, type SchemaType } from '@colyseus/schema';

/** Trạng thái một người chơi được đồng bộ cho mọi người trong phòng. */
export const Player = schema(
  {
    x: t.float32().default(0),
    y: t.float32().default(0),
    z: t.float32().default(0),
    rotY: t.float32().default(0),
    anim: t.string().default('idle'),
    /** Tên hiển thị (tạm do server đặt, chưa có tài khoản). */
    name: t.string().default(''),
    /** Chỉ số màu nhân vật tạm, client ánh xạ sang bảng màu. */
    look: t.uint8().default(0),
  },
  'Player',
);
export type Player = SchemaType<typeof Player>;

/** Trạng thái một khu (central, doson, ...). */
export const ZoneState = schema(
  {
    zone: t.string(),
    /** Phòng chỉ cho dùng câu chat có sẵn (CHAT_QUICK_ONLY=1). */
    quickOnly: t.boolean().default(false),
    players: t.map(Player),
  },
  'ZoneState',
);
export type ZoneState = SchemaType<typeof ZoneState>;
