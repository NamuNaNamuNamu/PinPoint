import { Socket } from "socket.io";
import { SocketEvents } from "../../shared/SocketEvents";
import { roomController } from "../features/room/RoomController";
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
     * @param socket イベントを受信する接続済みソケット
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
