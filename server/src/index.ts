import { defineRoom, defineServer } from 'colyseus';
import { ZoneRoom } from './rooms/ZoneRoom.ts';

const PORT = Number(process.env.PORT ?? 2567);

const server = defineServer({
  rooms: {
    // Người chơi cùng khu vào chung phòng; mỗi khu ghép phòng riêng.
    zone: defineRoom(ZoneRoom).filterBy(['zone']),
  },
});

await server.listen(PORT);
console.log(`[server] Colyseus đang chạy ở ws://localhost:${PORT}`);
