import { io, type Socket } from "socket.io-client";
import { SocketEvents } from "../../SocketEvents";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { roomController } from "../features/room/RoomController";
import { helloController } from "../features/hello/HelloController";
import { excalidrawSyncController } from "../features/excalidrawSync/ExcalidrawSyncController";

class SocketController {
    private socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;
    }

    public register() {
        // 受信
        this.socket.on(SocketEvents.HELLO, (message) => {
            const helloMessage = message;
            helloController.hello(helloMessage);
        }); // 双方向通信お試し

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
    public hello() {
        this.socket.emit(SocketEvents.HELLO, "こんにちは");
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

export const socketController = new SocketController(io("http://localhost:3001"));