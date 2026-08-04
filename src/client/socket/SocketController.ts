import { io, Socket } from "socket.io-client";

import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { roomController } from "../features/room/RoomController";
import { excalidrawSyncController } from "../features/excalidraw/excalidrawSync/ExcalidrawSyncController";
import { userController } from "../features/user/UserController";
import { SocketEvents } from "../../shared/SocketEvents";
import type { Room } from "../../server/features/room/RoomState";

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

        this.socket.on(SocketEvents.CREATE_ROOM, (message) => {
            const consoleLog = message;
            roomController.createRoom(consoleLog);
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
    
    public createRoom(): Promise<Room> {
        return new Promise((resolve, _reject) => {
            this.socket.emit(
                SocketEvents.CREATE_ROOM,
                "",
                (response: Room) => {
                    resolve(response);
                },
            );
        });
    }

    public joinRoom(roomId: string): Promise<string | null> {
        console.log(`roomId: ${roomId} に参加しようとしています。\nsocketId: ${this.socket.id}`)

        return new Promise((resolve, _reject) => {
            this.socket.emit(
                SocketEvents.JOIN_ROOM,
                roomId,
                // 部屋参加に失敗したら null で返却
                (response: string | null) => {
                    resolve(response);
                },
            );
        });
    }

    public getRoomId(): Promise<string | undefined> {
        return new Promise((resolve, _reject) => {
            this.socket.emit(
                SocketEvents.GET_ROOM_ID,
                "",
                (response: string | undefined) => {
                    resolve(response);
                },
            );
        });
    }

    public syncElements(elements: readonly ExcalidrawElement[]) {
        const message = elements;
        this.socket.emit(SocketEvents.SYNC_ELEMENTS, message);
    }
}

export const socketController = new SocketController(io("http://192.168.3.23:3001"));