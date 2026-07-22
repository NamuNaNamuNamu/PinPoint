import type { Socket } from "socket.io";
import { SocketEvents } from "../../../shared/SocketEvents";
import { socketLogger } from "../../logging/SocketLogger";

class RoomController {
    public joinRoom = (socket: Socket, roomId: string) => {
        const message = this.getJoinMessage(socket.id, roomId);
        socket.join(roomId);
        socketLogger.outputAllSockets(`部屋参加: ${socket.id}`);
        socket.to(roomId).emit(SocketEvents.JOIN_ROOM, `${message}`);
    };

    private getJoinMessage(socketId: string, roomId: String) {
        return `socketId: ${socketId} が roomId: ${roomId} に参加しました。`;
    }
}

export const roomController = new RoomController();