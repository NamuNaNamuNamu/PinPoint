import { Socket } from "socket.io";
import { SocketEvents } from "../../shared/SocketEvents";
import type { Cursor } from "../../shared/excalidraw/Cursor";
import { roomController } from "../features/room/RoomController";
import { excalidrawCursorSyncController } from "../features/excalidrawCursor/ExcalidrawCursorSyncController";
import { excalidrawSyncController } from "../features/excalidrawSync/ExcalidrawSyncController";
import { userController } from "../features/user/UserController";
import type { User } from "../features/user/User";
import type { UpdateSocketIdRequestType } from "../../client/socket/SocketController";

/**
 * 接続済みソケットのイベントハンドラーを登録する。
 */
export class SocketController {
    private socket: Socket;

    /**
     * 接続済みソケットを保持する。
     *
     * @param socket イベントを受信する接続済みソケット。
     */
    constructor(socket: Socket) {
        this.socket = socket;
    }

    /**
     * ユーザー操作、ルーム操作、Excalidraw要素同期のイベントを登録する。
     */
    public register() {
        // 受信
        this.socket.on(SocketEvents.REGISTER_USER, (message, callback) => {
            const userName: string = message;
            const user: User = userController.registerUser(this.socket, userName);

            // レスポンス
            callback(user);
        });

        this.socket.on(SocketEvents.GET_USER, (message, callback) => {
            const userId: number | undefined = message;
            const user: User | undefined = userController.getUser(userId);

            // レスポンス
            callback(user);
        });

        this.socket.on(SocketEvents.UPDATE_SOCKET_ID, (message: UpdateSocketIdRequestType, callback) => {
            const userId = message.userId;
            const socketId = message.socketId;
            const user: User | undefined = userController.updateSocketId(userId, socketId);

            // レスポンス
            callback(user);
        });

        this.socket.on(SocketEvents.CREATE_ROOM, (_message, callback) => {
            const room = roomController.createRoom();

            // レスポンス
            callback(room);
        });

        this.socket.on(SocketEvents.JOIN_ROOM, (message, callback) => {
            const userId = message?.userId;
            const roomId = message?.roomId;
            const response = roomController.joinRoom(this.socket, userId, roomId);

            callback(response);
        });

        this.socket.on(SocketEvents.LEAVE_ROOM, (message, callback) => {
            const roomId = message;
            excalidrawCursorSyncController.remove(this.socket);
            const response = roomController.leaveRoom(this.socket, roomId);

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

        this.socket.on(SocketEvents.SYNC_CURSOR, (message: Cursor) => {
            const cursor = message;
            excalidrawCursorSyncController.send(this.socket, cursor);
        });

        // disconnecting は Socket.IO が socket.rooms を空にする前に発火する。
        this.socket.on("disconnecting", () => {
            excalidrawCursorSyncController.remove(this.socket);
        });
    }
}
