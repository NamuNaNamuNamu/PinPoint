import { io, Socket } from "socket.io-client";
import { SocketEvents } from "../../SocketEvents";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { roomController } from "../features/room/RoomController";
import { excalidrawSyncController } from "../features/excalidrawSync/ExcalidrawSyncController";
import { userController } from "../features/user/UserController";

class SocketController {
    private socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;
    }

    public register() {
        // 受信
        this.socket.on(SocketEvents.REGISTER_USER, (message) => {
            const consoleLog = message;
            userController.registerUser(consoleLog);
        });

        this.socket.on(SocketEvents.JOIN_ROOM, (message) => {
            const consoleLog = message;
            roomController.joinRoom(consoleLog);
        });

        this.socket.on(SocketEvents.SYNC_ELEMENTS, (message) => {
            const elements = message;
            excalidrawSyncController.syncElements(elements);
        });
    }

    // 送信
    public registerUser(userName: string) {
        this.socket.emit(SocketEvents.REGISTER_USER, userName);
    }

    public joinRoom(roomId: string) {
        console.log(`roomId: ${roomId} に参加しようとしています。\nsocketId: ${this.socket.id}`)
        this.socket.emit(SocketEvents.JOIN_ROOM, roomId);
    }

    public syncElements(elements: readonly ExcalidrawElement[]) {
        const message = elements;
        this.socket.emit(SocketEvents.SYNC_ELEMENTS, message);
    }
}

export const socketController = new SocketController(io("http://192.168.3.6:3001"));