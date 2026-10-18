import type { QuestionApplied, QuestionRevealed } from "../../../shared/question/QuestionEvents";
import { SocketEvents } from "../../../shared/SocketEvents";
import { socket } from "../../socket/socket";
import { questionSceneController } from "./QuestionSceneController";

/**
 * サーバー主導の問題適用・正解表示イベントを登録する。
 *
 * @param operatorUserId 現在操作しているユーザー ID。
 */
export function registerQuestionListener(operatorUserId: number): void {
    socket.off(SocketEvents.QUESTION_APPLIED);
    socket.off(SocketEvents.QUESTION_REVEALED);
    socket.off(SocketEvents.QUESTION_SCROLL_TO_CONTENT);
    socket.on(SocketEvents.QUESTION_APPLIED, (payload: QuestionApplied) => questionSceneController.apply(payload, operatorUserId));
    socket.on(SocketEvents.QUESTION_REVEALED, (payload: QuestionRevealed) => questionSceneController.reveal(payload));
    socket.on(SocketEvents.QUESTION_SCROLL_TO_CONTENT, () => questionSceneController.scrollToCurrentContent());
}
