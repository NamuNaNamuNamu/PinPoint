import type { Socket } from "socket.io";

import type { Cursor, CursorRevealUpdated, RemoteCursor } from "../../../shared/excalidraw/Cursor";
import type { ApplyQuestionResult } from "../../../shared/question/QuestionEvents";
import { SocketEvents } from "../../../shared/SocketEvents";
import { roomController } from "../room/RoomController";
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

        const room = roomController.getRoom(roomId);
        if (!room?.isCursorRevealed()) {
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
     * 作成者の要求により、ルーム内の共有カーソル公開状態を更新する。
     *
     * 無効な入力、存在しないルーム、作成者以外、または未参加ユーザーの要求は
     * 状態を変更しない。状態が変化した場合だけ、同一ルーム全体へ通知する。
     *
     * @param socket 更新要求を受信した Socket.IO 接続。
     * @param userId 更新を要求した認証済みユーザー ID。
     * @param roomId 更新対象のルーム ID。
     * @param cursorRevealed 更新後の共有カーソル公開状態。
     * @returns サーバーによる受理または拒否の結果。
     */
    public setCursorRevealed(
        socket: Socket,
        userId: number | undefined,
        roomId: string | undefined,
        cursorRevealed: unknown,
    ): ApplyQuestionResult {
        if (userId === undefined || !roomId || typeof cursorRevealed !== "boolean") {
            return { ok: false, reason: "invalid-request" };
        }
        const room = roomController.getRoom(roomId);
        if (!room) {
            return { ok: false, reason: "room-not-found" };
        }
        if (!room.isCreatedBy(userId)) {
            return { ok: false, reason: "not-creator" };
        }
        if (!room.hasUser(userId)) {
            return { ok: false, reason: "not-member" };
        }
        if (room.setCursorRevealed(cursorRevealed)) {
            socket.nsp.to(roomId).emit(SocketEvents.CURSOR_REVEAL_UPDATED, {
                cursorRevealed: room.isCursorRevealed(),
            } satisfies CursorRevealUpdated);
        }
        return { ok: true };
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
