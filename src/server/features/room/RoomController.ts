import type { Socket } from "socket.io";
import { socketLogger } from "../../logging/SocketLogger";
import { roomState, type Room } from "./RoomState";
import { roomLogger } from "../../logging/RoomLogger";

class RoomController {
    public createRoom = (): Room => {
        const room: Room = roomState.addRoom();
        return room;
    };

    public joinRoom = (socket: Socket, roomId: string): string | null => {
        const success = roomState.join(roomId, socket.id);
        if (success) { socket.join(roomId); }
        roomLogger.outputRoomState(roomState);
        if (success) socketLogger.outputAllSockets({
            event: "部屋参加",
            socketId: socket.id
        });
        
        let response;
        if (success) {
            response = roomId;
        } else {
            response = null;
        }
        return response;
    };

    public getRoomId = (socket: Socket) => {
        const roomId: string | undefined = roomState.getRoomIdBySocketId(socket.id);
        return roomId;
    }
}

export const roomController = new RoomController();