import type { AnswerBarAdded, AnswerBarOwnerNameUpdated, AnswerBarRemoved } from "../../../shared/answerBar/AnswerBarEvents";
import { SocketEvents } from "../../../shared/SocketEvents";
import { socket } from "../../socket/socket";
import { answerBarSceneController } from "./AnswerBarSceneController";

/**
 * サーバーから通知される AnswerBar の追加・削除イベントを登録する。
 *
 * @param operatorUserId 現在操作しているユーザー ID。
 */
export function registerAnswerBarListener(operatorUserId: number): void {
    answerBarSceneController.setOperatorUserId(operatorUserId);
    socket.off(SocketEvents.ANSWER_BAR_ADDED);
    socket.off(SocketEvents.ANSWER_BAR_REMOVED);
    socket.off(SocketEvents.ANSWER_BAR_OWNER_NAME_UPDATED);

    socket.on(SocketEvents.ANSWER_BAR_ADDED, (event: AnswerBarAdded) => {
        answerBarSceneController.add(event, operatorUserId);
    });

    socket.on(SocketEvents.ANSWER_BAR_REMOVED, (event: AnswerBarRemoved) => {
        answerBarSceneController.remove(event);
    });

    socket.on(SocketEvents.ANSWER_BAR_OWNER_NAME_UPDATED, (event: AnswerBarOwnerNameUpdated) => {
        answerBarSceneController.updateOwnerName(event);
    });
}
