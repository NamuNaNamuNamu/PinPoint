import type { Collaborator, SocketId } from "@excalidraw/excalidraw/types";

import type { RemoteCursor } from "../../../../shared/excalidraw/Cursor";
import { excalidrawAPIHolder } from "../ExcalidrawAPIHolder";

/**
 * リモートユーザーのカーソルを保持し、Excalidraw の collaborators を更新する。
 */
class ExcalidrawCursorSyncController {
    private collaborators = new Map<SocketId, Collaborator>();

    /**
     * 受信したカーソルを追加または更新する。
     *
     * @param cursor サーバーが接続 ID と表示名を付加したカーソル情報。
     */
    public updateCursor(cursor: RemoteCursor): void {
        const collaborators = new Map(this.collaborators);
        collaborators.set(cursor.socketId as SocketId, {
            pointer: cursor.pointer,
            button: cursor.button,
            username: cursor.username,
        });

        this.collaborators = collaborators;
        this.updateScene();
    }

    /**
     * 指定した接続のカーソルを削除する。
     *
     * @param socketId 退出または切断した接続 ID。
     */
    public removeCursor(socketId: string): void {
        const collaborators = new Map(this.collaborators);
        collaborators.delete(socketId as SocketId);

        this.collaborators = collaborators;
        this.updateScene();
    }

    /**
     * 保持中の共同編集者カーソルをすべて削除する。
     */
    public clear(): void {
        this.collaborators = new Map<SocketId, Collaborator>();
        this.updateScene();
    }

    /**
     * 保持中の共同編集者カーソルを Excalidraw のシーンへ反映する。
     *
     * @returns 戻り値はない。
     */
    private updateScene(): void {
        excalidrawAPIHolder.getApi().updateScene({
            collaborators: this.collaborators,
        });
    }
}

export const excalidrawCursorSyncController = new ExcalidrawCursorSyncController();
