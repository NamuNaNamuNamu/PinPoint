import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { SocketEvents } from "../../shared/SocketEvents";
import type { UserParams } from "../../server/features/user/User";
import { socket } from "./socket";

class SocketController {
    public registerUser(userName: string): Promise<UserParams> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.REGISTER_USER, userName, (response: UserParams) => {
                resolve(response);
            });
        });
    }

    public getUser(userId: number | undefined): Promise<UserParams | undefined> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.GET_USER, userId, (response: UserParams | undefined) => {
                resolve(response);
            });
        });
    }

    public updateSocketId(userId: number | undefined): Promise<UserParams | undefined> {
        return new Promise((resolve, _reject) => {
            socket.emit(
                SocketEvents.UPDATE_SOCKET_ID,
                {
                    userId: userId,
                    socketId: socket.id,
                },
                (response: UserParams | undefined) => {
                    resolve(response);
                },
            );
        });
    }

    public createRoom(): Promise<any> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.CREATE_ROOM, "", (response: any) => {
                resolve(response);
            });
        });
    }

    public joinRoom(userId: number, roomId: string): Promise<string | null> {
        console.log(`roomId: ${roomId} に参加しようとしています。\nsocketId: ${socket.id}`);

        return new Promise((resolve, _reject) => {
            socket.emit(
                SocketEvents.JOIN_ROOM,
                {
                    userId: userId,
                    roomId: roomId,
                },
                // 部屋参加に失敗したら null で返却
                (response: string | null) => {
                    resolve(response);
                },
            );
        });
    }

    public getRoomId(): Promise<string | undefined> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.GET_ROOM_ID, "", (response: string | undefined) => {
                resolve(response);
            });
        });
    }

    public syncElements(elements: readonly ExcalidrawElement[]) {
        const message = elements;
        socket.emit(SocketEvents.SYNC_ELEMENTS, message);
    }
}

export type UpdateSocketIdRequestType = {
    userId: number | undefined;
    socketId: string;
};

export const socketController = new SocketController();
