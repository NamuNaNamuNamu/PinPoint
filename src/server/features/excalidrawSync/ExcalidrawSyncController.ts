import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { Socket } from "socket.io";

import type { ElementsSyncMessage } from "../../../shared/excalidraw/ElementsSyncEvents";
import { SocketEvents } from "../../../shared/SocketEvents";
import { answerBarAssignmentState } from "../answerBar/AnswerBarAssignmentState";
import { questionController } from "../question/QuestionController";
import { externalElementsState } from "./ExternalElementsState";

/**
 * Excalidraw 要素を同じルームの他クライアントへ同期する。
 */
class ExcalidrawSyncController {
    private readonly pendingByRoom = new Map<string, Map<string, ExcalidrawElement>>();
    private readonly timersByRoom = new Map<string, ReturnType<typeof setTimeout>>();
    /**
     * 送信元ソケットが参加するルームへ、要素同期イベントを送信する。
     *
     * AnswerBar の追加、削除、位置更新はサーバー発行の専用イベントを正とする。そのため、
     * 現在・過去を含む既知の AnswerBar 要素は `SYNC_ELEMENTS` から除外して中継する。
     *
     * @param socket 要素を送信したクライアントのソケット。
     * @param elements 同期する Excalidraw 要素。
     * 参加ルームが 1 件でない場合は何も送信しない。
     */
    public send = (socket: Socket, message: ElementsSyncMessage): void => {
        const roomIds = [...socket.rooms].filter((roomId) => roomId !== socket.id);
        if (roomIds.length !== 1) {
            return;
        }

        const roomId = roomIds[0];
        if (!roomId) {
            throw new Error("roomId が未設定です");
        }

        const answerBarSanitizedElements = answerBarAssignmentState.excludeAnswerBarElements(roomId, message.elements);
        const sanitizedElements = questionController.excludeManagedElements(roomId, answerBarSanitizedElements);
        const changed = externalElementsState.merge(roomId, message.epoch, sanitizedElements);
        if (changed.length === 0) return;
        const pending = this.pendingByRoom.get(roomId) ?? new Map<string, ExcalidrawElement>();
        changed.forEach((element) => pending.set(element.id, element));
        this.pendingByRoom.set(roomId, pending);
        if (this.timersByRoom.has(roomId)) return;
        this.timersByRoom.set(
            roomId,
            setTimeout(() => this.flush(socket, roomId), 1000 / 15),
        );
    };

    /**
     * 再接続元の変更をキャッシュと merge し、復帰者だけへ snapshot を返す。
     *
     * AnswerBar と問題管理要素は除外し、管理外要素だけを version 順で統合する。
     *
     * @param socket snapshot の送信先ソケット。
     * @param roomId 参加済みルーム ID。
     * @param elements 復帰元が保持していた scene 要素。
     */
    public restore(socket: Socket, roomId: string, elements: readonly ExcalidrawElement[]): void {
        const withoutAnswerBars = answerBarAssignmentState.excludeAnswerBarElements(roomId, elements);
        const epoch = externalElementsState.getEpoch(roomId);
        externalElementsState.merge(
            roomId,
            epoch,
            questionController.excludeManagedElements(roomId, withoutAnswerBars),
        );
        socket.emit(SocketEvents.CURRENT_EXTERNAL_ELEMENTS, {
            epoch,
            elements: externalElementsState.get(roomId),
        } satisfies ElementsSyncMessage);
    }

    /**
     * 外部要素を削除する操作に合わせ、保留差分と配信タイマーを破棄する。
     *
     * @param roomId 対象ルーム ID。
     * @returns 破棄後に有効となる同期世代。
     */
    public reset(roomId: string): number {
        const timer = this.timersByRoom.get(roomId);
        if (timer !== undefined) clearTimeout(timer);
        this.timersByRoom.delete(roomId);
        this.pendingByRoom.delete(roomId);
        return externalElementsState.reset(roomId);
    }

    /**
     * 空ルームの同期状態を破棄する。
     *
     * @param roomId 破棄対象のルーム ID。
     */
    public clear(roomId: string): void {
        const timer = this.timersByRoom.get(roomId);
        if (timer !== undefined) clearTimeout(timer);
        this.timersByRoom.delete(roomId);
        this.pendingByRoom.delete(roomId);
        externalElementsState.clear(roomId);
    }

    /**
     * 保留中の要素差分を、対象ルームの全接続へまとめて配信する。
     *
     * @param socket 配信に使用する Socket.IO 接続。
     * @param roomId 配信対象のルーム ID。
     */
    private flush(socket: Socket, roomId: string): void {
        this.timersByRoom.delete(roomId);
        const pending = this.pendingByRoom.get(roomId);
        this.pendingByRoom.delete(roomId);
        if (!pending || pending.size === 0) return;
        socket.nsp.to(roomId).emit(SocketEvents.SYNC_ELEMENTS, {
            epoch: externalElementsState.getEpoch(roomId),
            elements: [...pending.values()],
        } satisfies ElementsSyncMessage);
    }
}

export const excalidrawSyncController = new ExcalidrawSyncController();
