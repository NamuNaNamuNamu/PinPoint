import type { Socket } from "socket.io";

class RoomController {
    public join = (socket: Socket, roomId: string) => {
        // 
        socket.join(roomId);
    };
}

export const roomController = new RoomController();