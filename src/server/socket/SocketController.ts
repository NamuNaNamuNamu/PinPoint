import type { Socket } from "socket.io";

import type { UpdateSocketIdRequestType } from "../../client/socket/SocketController";
import type { Cursor } from "../../shared/excalidraw/Cursor";
import type { ApplyQuestionResult } from "../../shared/question/QuestionEvents";
import { SocketEvents } from "../../shared/SocketEvents";
import { answerBarController } from "../features/answerBar/AnswerBarController";
import { excalidrawCursorSyncController } from "../features/excalidrawCursor/ExcalidrawCursorSyncController";
import { excalidrawSyncController } from "../features/excalidrawSync/ExcalidrawSyncController";
import { questionController } from "../features/question/QuestionController";
import { roomController } from "../features/room/RoomController";
import type { User } from "../features/user/User";
import { userController } from "../features/user/UserController";

/** 接続済みソケットのイベントハンドラーを登録する。 */
export class SocketController {
    /** イベントを受信し、同一ルームへの通知にも使用する接続済みソケット。 */
    private socket: Socket;

    /** この接続に紐付く、登録または再接続済みユーザーの ID。 */
    private activeUserId: number | undefined;

    /**
     * 接続済みソケットのコントローラーを初期化する。
     *
     * @param socket イベントを受信する Socket.IO 接続。
     */
    constructor(socket: Socket) {
        this.socket = socket;
    }

    /**
     * クライアントから受信する Socket.IO イベントのハンドラーを登録する。
     *
     * AnswerBar の参加・退出・切断処理は `AnswerBarController` に委譲し、
     * このクラスはイベントとアプリケーション処理の接続に専念する。
     */
    public register(): void {
        this.socket.on(SocketEvents.REGISTER_USER, (message, callback) => {
            const userName: string = message;
            const user: User = userController.registerUser(this.socket, userName);
            this.activeUserId = user.getId();

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
            this.activeUserId = user?.getId();

            // レスポンス
            callback(user);
        });

        this.socket.on(SocketEvents.UPDATE_USER_NAME, (message, callback) => {
            const userName: string = message;
            const user = userController.updateUserName(this.activeUserId, userName);
            if (user) {
                answerBarController.updateOwnerUserName(this.socket, user.getId(), user.getName());
            }

            callback(user);
        });

        this.socket.on(SocketEvents.CREATE_ROOM, (_message, callback) => {
            if (this.activeUserId === undefined) {
                callback(null);
                return;
            }
            const room = roomController.createRoom(this.activeUserId);

            // レスポンス
            callback(room);
        });

        this.socket.on(SocketEvents.JOIN_ROOM, (message, callback) => {
            const userId: number | undefined = message?.userId;
            const roomId: string | undefined = message?.roomId;
            if (userId === undefined || !roomId) {
                // レスポンス
                callback(null);
                return;
            }

            this.activeUserId = userId;

            // レスポンス
            callback(answerBarController.joinRoom(this.socket, userId, roomId));
        });

        this.socket.on(SocketEvents.LEAVE_ROOM, (message, callback) => {
            const roomId: string = message;
            callback(answerBarController.leaveRoom(this.socket, this.activeUserId, roomId));
        });

        this.socket.on(SocketEvents.GET_ROOM_ID, (_message, callback) => {
            // レスポンス
            callback(roomController.getRoomId(this.socket));
        });

        this.socket.on(SocketEvents.SYNC_ELEMENTS, (message) => {
            excalidrawSyncController.send(this.socket, message);
        });

        this.socket.on(SocketEvents.SYNC_CURSOR, (message: Cursor) => {
            excalidrawCursorSyncController.send(this.socket, message);
        });

        this.socket.on(SocketEvents.APPLY_QUESTION, (message, callback: (result: ApplyQuestionResult) => void) => {
            const result = questionController.apply(this.socket, this.activeUserId, message);
            console.debug("[apply-question]", {
                userId: this.activeUserId,
                roomId: message?.roomId,
                deleteExternalElements: message?.deleteExternalElements,
                result,
            });
            callback(result);
        });

        this.socket.on(SocketEvents.REVEAL_QUESTION, (message) => {
            questionController.reveal(this.socket, this.activeUserId, message?.roomId);
        });

        this.socket.on(SocketEvents.CONTROL_CURRENT_QUESTION, (message, callback) => {
            callback(questionController.controlCurrent(this.socket, this.activeUserId, message));
        });

        this.socket.on("disconnecting", () => {
            // Socket.IO が socket.rooms を空にする前に発火する。
            excalidrawCursorSyncController.remove(this.socket);
            answerBarController.handleDisconnecting(this.socket, this.activeUserId);
            roomController.handleDisconnecting(this.socket, this.activeUserId);
        });
    }
}
