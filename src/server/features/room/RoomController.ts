import type { Socket } from "socket.io";
import { SocketEvents } from "../../../shared/SocketEvents";
import { socketLogger } from "../../logging/SocketLogger";
import { roomState, type Room } from "./RoomState";

class RoomController {
    public createRoom = (): Room => {
        const room: Room = roomState.addRoom();
        return room;
    };

    public joinRoom = (socket: Socket, roomId: string) => {
        socket.join(roomId);
        socketLogger.outputAllSockets(`部屋参加: ${socket.id}`);

        const message = `socketId: ${socket.id} が roomId: ${roomId} に参加しました。`;
        socket.to(roomId).emit(SocketEvents.JOIN_ROOM, `${message}`);
    };
}

export const roomController = new RoomController();