import type { Collaborator, SocketId } from "@excalidraw/excalidraw/types";

import type { RemoteCursor } from "../../../../shared/excalidraw/Cursor";
import { excalidrawAPIHolder } from "../ExcalidrawAPIHolder";
import { excalidrawSyncController } from "../excalidrawSync/ExcalidrawSyncController";

/**
 * リモートユーザーのカーソルを保持し、Excalidraw の collaborators を画面描画単位で更新する。
 */
class ExcalidrawCursorSyncController {
    private collaborators = new Map<SocketId, Collaborator>();
    /**
     * 予約済みの描画フレーム ID。
     */
    private animationFrameId: number | undefined;

    /**
     * 受信したカーソルを追加または更新する。
     *
     * @param cursor サーバーが接続 ID と表示名を付加したカーソル情報。
     */
    public updateCursor(cursor: RemoteCursor): void {
        this.collaborators.set(cursor.socketId as SocketId, {
            pointer: cursor.pointer,
            button: cursor.button,
            username: cursor.username,
        });

        this.scheduleUpdateScene();
    }

    /**
     * 指定した接続のカーソルを削除する。
     *
     * @param socketId 退出または切断した接続 ID。
     */
    public removeCursor(socketId: string): void {
        this.collaborators.delete(socketId as SocketId);

        this.scheduleUpdateScene();
    }

    /**
     * 保持中の共同編集者カーソルをすべて削除する。
     */
    public clear(): void {
        this.collaborators.clear();

        this.scheduleUpdateScene();
    }

    /**
     * 次の画面描画時に collaborators を反映する処理を予約する。
     *
     * 同一フレーム内の複数の更新は、最後に保持したカーソル状態として一度だけ反映する。
     */
    private scheduleUpdateScene(): void {
        if (this.animationFrameId !== undefined) {
            return;
        }

        this.animationFrameId = requestAnimationFrame(() => {
            this.animationFrameId = undefined;
            this.updateScene();
        });
    }

    /**
     * 保持中の共同編集者カーソルを Excalidraw のシーンへ反映する。
     *
     * @returns 戻り値はない。
     */
    private updateScene(): void {
        excalidrawSyncController.applyRemote(() => {
            excalidrawAPIHolder.getApi().updateScene({
                collaborators: new Map(this.collaborators),
            });
        });
    }
}

export const excalidrawCursorSyncController = new ExcalidrawCursorSyncController();
