import type { Socket } from "socket.io";

import type { Cursor, RemoteCursor } from "../../../shared/excalidraw/Cursor";
import { SocketEvents } from "../../../shared/SocketEvents";
import { userService } from "../user/UserService";

/**
 * カーソル情報を同一ルームの他クライアントへ中継する。
 */
class ExcalidrawCursorSyncController {
    /**
     * サーバーで送信元の接続 ID と表示名を付与して中継する。
     *
     * @param socket カーソルを送信した接続。
     * @param cursor クライアントが送信した座標とボタン状態。
     */
    public send(socket: Socket, cursor: Cursor): void {
        const roomId = this.getRoomId(socket);
        if (!roomId) {
            return;
        }

        const user = userService.getUserBySocketId(socket.id);
        if (!user) {
            return;
        }

        const remoteCursor: RemoteCursor = {
            ...cursor,
            socketId: socket.id,
            username: user.getName(),
        };
        socket.to(roomId).emit(SocketEvents.SYNC_CURSOR, remoteCursor);
    }

    /**
     * 同一ルームの他クライアントへカーソル削除を通知する。
     *
     * `disconnecting` 中に呼び出すことで、Socket.IO が所属ルームを離れる前の
     * ルーム ID を使用する。
     *
     * @param socket 退出または切断する接続。
     */
    public remove(socket: Socket): void {
        const roomId = this.getRoomId(socket);
        if (!roomId) {
            return;
        }

        socket.to(roomId).emit(SocketEvents.REMOVE_CURSOR, socket.id);
    }

    /**
     * Socket.IO 接続が所属するアプリケーションのルーム ID を取得する。
     *
     * @param socket ルーム ID を取得する Socket.IO 接続。
     * @returns 接続先がちょうど1ルームの場合はその ID。それ以外は `undefined`。
     */
    private getRoomId(socket: Socket): string | undefined {
        const roomIds = [...socket.rooms].filter((roomId) => roomId !== socket.id);

        if (roomIds.length !== 1) {
            return undefined;
        }

        return roomIds.at(0);
    }
}

export const excalidrawCursorSyncController = new ExcalidrawCursorSyncController();
