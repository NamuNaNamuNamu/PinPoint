import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { Socket } from "socket.io";

import { SocketEvents } from "../../../shared/SocketEvents";
import { answerBarAssignmentState } from "../answerBar/AnswerBarAssignmentState";
import { questionController } from "../question/QuestionController";

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
        socket.to(roomId).emit(SocketEvents.SYNC_ELEMENTS, sanitizedElements);
    };
}

export const excalidrawSyncController = new ExcalidrawSyncController();
