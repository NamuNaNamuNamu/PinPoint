import type { Socket } from "socket.io";
import { SocketEvents } from "../../../SocketEvents";

class RoomController {
    public joinRoom = (socket: Socket, roomId: string) => {
        const message = `socketId: ${socket.id} が roomId: ${roomId} に参加しました。`;

        console.log(`${message}\n`)
        socket.join(roomId);
        socket.to(roomId).emit(SocketEvents.JOIN_ROOM, `${message}`);
    };
}

export const roomController = new RoomController();