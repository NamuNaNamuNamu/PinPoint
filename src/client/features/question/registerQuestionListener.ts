import type { CurrentQuestionState, QuestionApplied, QuestionRevealed } from "../../../shared/question/QuestionEvents";
import { SocketEvents } from "../../../shared/SocketEvents";
import { socket } from "../../socket/socket";
import { socketController } from "../../socket/SocketController";
import { roomSettingsStore } from "../room/roomSettingsStore";
import { questionSceneController } from "./QuestionSceneController";

/**
 * サーバー主導の問題適用、再接続用現在状態、正解表示の各イベントを登録する。
 *
 * 問題状態に含まれる AnswerBar 公開設定は、scene とルーム設定 UI の両方へ反映する。
 *
 * @param operatorUserId 現在操作しているユーザー ID。
 */
export function registerQuestionListener(operatorUserId: number): void {
    socket.off(SocketEvents.QUESTION_APPLIED);
    socket.off(SocketEvents.CURRENT_QUESTION_STATE);
    socket.off(SocketEvents.QUESTION_REVEALED);
    socket.off(SocketEvents.QUESTION_SCROLL_TO_CONTENT);
    socket.off(SocketEvents.QUESTION_REMOVE_EXTERNAL_ELEMENTS);
    socket.on(SocketEvents.QUESTION_APPLIED, (payload: QuestionApplied) => {
        socketController.setSyncEpoch(payload.syncEpoch ?? 0);
        questionSceneController.apply(payload, operatorUserId);
        roomSettingsStore.setAnswerBarReveal(payload.answerBarReveal);
    });
    socket.on(SocketEvents.CURRENT_QUESTION_STATE, (payload: CurrentQuestionState) => {
        socketController.setSyncEpoch(payload.syncEpoch ?? 0);
        questionSceneController.apply(payload, operatorUserId);
        roomSettingsStore.setAnswerBarReveal(payload.answerBarReveal);
    });
    socket.on(SocketEvents.QUESTION_REVEALED, (payload: QuestionRevealed) => questionSceneController.reveal(payload));
    socket.on(SocketEvents.QUESTION_SCROLL_TO_CONTENT, () => questionSceneController.scrollToCurrentContent());
    socket.on(SocketEvents.QUESTION_REMOVE_EXTERNAL_ELEMENTS, (payload: { syncEpoch: number }) => {
        socketController.setSyncEpoch(payload.syncEpoch);
        questionSceneController.removeExternalElements();
    });
}
