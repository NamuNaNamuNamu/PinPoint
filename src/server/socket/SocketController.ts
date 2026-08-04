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

        this.socket.on(SocketEvents.CREATE_ROOM, (_message, callback) => {
            const room = roomController.createRoom();

            // レスポンス
            callback(room);
        });

        this.socket.on(SocketEvents.JOIN_ROOM, (message, callback) => {
            const roomId = message;
            const response = roomController.joinRoom(this.socket, roomId);

            callback(response);
        });

        this.socket.on(SocketEvents.GET_ROOM_ID, (_message, callback) => {
            const roomId = roomController.getRoomId(this.socket);

            // レスポンス
            callback(roomId);
        });

        this.socket.on(SocketEvents.SYNC_ELEMENTS, (message) => {
            const elements = message;
            excalidrawSyncController.send(this.socket, elements);
        });
    }
}