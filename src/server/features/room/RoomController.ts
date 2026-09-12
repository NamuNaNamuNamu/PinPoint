import type { Socket } from "socket.io";
import { socketLogger } from "../../logging/SocketLogger";
import { Room } from "./Room";
import { roomService } from "./RoomService";

class RoomController {
    public createRoom = (): Room => {
        return roomService.createRoom();
    };

    public joinRoom = (socket: Socket, userId: number, roomId: string): string | null => {
        const success = roomService.joinRoom(userId, roomId);

        if (success) {
            socket.join(roomId);
            socketLogger.outputAllSockets({
                event: "部屋参加",
                socketId: socket.id,
            });
        }

        return success ? roomId : null;
    };

    public getRoomId = (socket: Socket): string | undefined => {
        return roomService.getRoomIdBySocketId(socket.id);
    };
}

export const roomController = new RoomController();
