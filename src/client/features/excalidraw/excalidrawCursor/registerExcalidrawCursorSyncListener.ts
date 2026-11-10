import { SocketEvents } from "../../../../shared/SocketEvents";
import type { CursorRevealUpdated } from "../../../../shared/excalidraw/Cursor";
import { socket } from "../../../socket/socket";
import { excalidrawCursorSyncController } from "./ExcalidrawCursorSyncController";

/**
 * サーバーから通知される共同カーソルの更新・削除イベントを登録する。
 */
export function registerExcalidrawCursorSyncListener(): void {
    socket.on(SocketEvents.SYNC_CURSOR, (cursor) => {
        excalidrawCursorSyncController.updateCursor(cursor);
    });

    socket.on(SocketEvents.REMOVE_CURSOR, (socketId) => {
        excalidrawCursorSyncController.removeCursor(socketId);
    });

    socket.on(SocketEvents.CURSOR_REVEAL_UPDATED, (event: CursorRevealUpdated) => {
        excalidrawCursorSyncController.setCursorRevealed(event.cursorRevealed);
    });
}
