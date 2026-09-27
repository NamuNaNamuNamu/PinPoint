import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { SocketEvents } from "../../shared/SocketEvents";
import type { UserParams } from "../../server/features/user/User";
import { socket } from "./socket";

/**
 * クライアントから Socket.IO のイベントを送信する。
 */
class SocketController {
    /**
     * ユーザー登録を要求する。
     *
     * @param userName 登録するユーザー名。
     * @returns 登録されたユーザー情報。
     */
    public registerUser(userName: string): Promise<UserParams> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.REGISTER_USER, userName, (response: UserParams) => {
                resolve(response);
            });
        });
    }

    /**
     * 指定した ID のユーザー情報を取得する。
     *
     * @param userId 取得するユーザー ID。
     * @returns ユーザー情報。見つからない場合は `undefined`。
     */
    public getUser(userId: number | undefined): Promise<UserParams | undefined> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.GET_USER, userId, (response: UserParams | undefined) => {
                resolve(response);
            });
        });
    }

    /**
     * ユーザーに紐付く Socket.IO 接続 ID を現在の接続 ID へ更新する。
     *
     * @param userId 更新するユーザー ID。
     * @returns 更新後のユーザー情報。ユーザーが見つからない場合は `undefined`。
     */
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

    /**
     * 新しいルームの作成を要求する。
     *
     * @returns 作成されたルーム。
     */
    public createRoom(): Promise<any> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.CREATE_ROOM, "", (response: any) => {
                resolve(response);
            });
        });
    }

    /**
     * ユーザーを指定したルームへ参加させる。
     *
     * @param userId 参加するユーザー ID。
     * @param roomId 参加先のルーム ID。
     * @returns 参加したルーム ID。参加に失敗した場合は `null`。
     */
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

    /**
     * 現在の接続を指定したルームから退出させる。
     *
     * @param roomId 退出するルーム ID。
     * @returns 退出したルーム ID。退出に失敗した場合は `null`。
     */
    public leaveRoom(roomId: string): Promise<string | null> {
        console.log(`roomId: ${roomId} から退出しようとしています。\nsocketId: ${socket.id}`);

        return new Promise((resolve, _reject) => {
            socket.emit(
                SocketEvents.LEAVE_ROOM,
                roomId,
                // 部屋退出に失敗したら null で返却
                (response: string | null) => {
                    resolve(response);
                },
            );
        });
    }

    /**
     * 現在の接続が所属するルーム ID を取得する。
     *
     * @returns ルーム ID。所属していない場合は `undefined`。
     */
    public getRoomId(): Promise<string | undefined> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.GET_ROOM_ID, "", (response: string | undefined) => {
                resolve(response);
            });
        });
    }

    /**
     * Excalidraw 要素を他のクライアントへ同期する。
     *
     * @param elements 同期する Excalidraw 要素。
     */
    public syncElements(elements: readonly ExcalidrawElement[]) {
        const message = elements;
        socket.emit(SocketEvents.SYNC_ELEMENTS, message);
    }
}

/**
 * Socket.IO 接続 ID を更新するリクエスト。
 */
export type UpdateSocketIdRequestType = {
    userId: number | undefined;
    socketId: string;
};

export const socketController = new SocketController();
