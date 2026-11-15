import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { Socket } from "socket.io";

import { SocketEvents } from "../../../shared/SocketEvents";
import { answerBarAssignmentState } from "../answerBar/AnswerBarAssignmentState";
import { questionController } from "../question/QuestionController";
import { externalElementsState } from "./ExternalElementsState";

/**
 * Excalidraw 要素を同じルームの他クライアントへ同期する。
 */
class ExcalidrawSyncController {
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
    public send = (socket: Socket, elements: readonly ExcalidrawElement[]): void => {
        const roomIds = [...socket.rooms].filter((roomId) => roomId !== socket.id);
        if (roomIds.length !== 1) {
            return;
        }

        const roomId = roomIds[0];
        if (!roomId) {
            throw new Error("roomId が未設定です");
        }

        const answerBarSanitizedElements = answerBarAssignmentState.excludeAnswerBarElements(roomId, elements);
        const sanitizedElements = questionController.excludeManagedElements(roomId, answerBarSanitizedElements);
        socket.to(roomId).emit(SocketEvents.SYNC_ELEMENTS, externalElementsState.merge(roomId, sanitizedElements));
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
        externalElementsState.merge(roomId, questionController.excludeManagedElements(roomId, withoutAnswerBars));
        socket.emit(SocketEvents.CURRENT_EXTERNAL_ELEMENTS, externalElementsState.get(roomId));
    }
}

export const excalidrawSyncController = new ExcalidrawSyncController();
