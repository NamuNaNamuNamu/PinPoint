import type {
    AnswerBarAdded,
    AnswerBarOwnerNameUpdated,
    AnswerBarPositionUpdated,
    AnswerBarRemoved,
    AnswerBarRevealUpdated,
} from "../../../shared/answerBar/AnswerBarEvents";
import { SocketEvents } from "../../../shared/SocketEvents";
import { socket } from "../../socket/socket";
import { answerBarSceneController } from "./AnswerBarSceneController";

/**
 * サーバーから通知される AnswerBar の追加、削除、所有者名、および位置更新イベントを登録する。
 *
 * @param operatorUserId 現在操作しているユーザー ID。
 */
export function registerAnswerBarListener(operatorUserId: number): void {
    answerBarSceneController.setOperatorUserId(operatorUserId);
    socket.off(SocketEvents.ANSWER_BAR_ADDED);
    socket.off(SocketEvents.ANSWER_BAR_REMOVED);
    socket.off(SocketEvents.ANSWER_BAR_OWNER_NAME_UPDATED);
    socket.off(SocketEvents.ANSWER_BAR_POSITION_UPDATED);
    socket.off(SocketEvents.ANSWER_BAR_REVEAL_UPDATED);

    socket.on(SocketEvents.ANSWER_BAR_ADDED, (event: AnswerBarAdded) => {
        answerBarSceneController.add(event, operatorUserId);
    });

    socket.on(SocketEvents.ANSWER_BAR_REMOVED, (event: AnswerBarRemoved) => {
        answerBarSceneController.remove(event);
    });

    socket.on(SocketEvents.ANSWER_BAR_OWNER_NAME_UPDATED, (event: AnswerBarOwnerNameUpdated) => {
        answerBarSceneController.updateOwnerName(event);
    });
    socket.on(SocketEvents.ANSWER_BAR_POSITION_UPDATED, (event: AnswerBarPositionUpdated) => {
        answerBarSceneController.updatePosition(event);
    });
    socket.on(SocketEvents.ANSWER_BAR_REVEAL_UPDATED, (event: AnswerBarRevealUpdated) => {
        answerBarSceneController.setAnswerBarReveal(event.answerBarReveal);
    });
}
