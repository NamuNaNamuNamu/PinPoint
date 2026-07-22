import { Socket } from "socket.io";
import { SocketEvents } from "../../shared/SocketEvents";
import { roomController } from "../features/room/RoomController";
import { excalidrawSyncController } from "../features/excalidrawSync/ExcalidrawSyncController";
import { userController } from "../features/user/UserController";

export class SocketController {
    private socket: Socket;
    
    constructor(socket: Socket) {
        this.socket = socket;
    }

    public register() {
        // 受信
        this.socket.on(SocketEvents.REGISTER_USER, (message) => {
            const userName = message;
            userController.registerUser(this.socket, userName);
        });

        this.socket.on(SocketEvents.JOIN_ROOM, (message) => {
            const roomId = message;
            roomController.joinRoom(this.socket, roomId);
        });

        this.socket.on(SocketEvents.SYNC_ELEMENTS, (message) => {
            const elements = message;
            excalidrawSyncController.send(this.socket, elements);
        });
    }
}