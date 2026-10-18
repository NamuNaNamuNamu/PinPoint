import type { Socket } from "socket.io";

import { getQuestionTemplate } from "../../../shared/question/QuestionTemplate";
import { SocketEvents } from "../../../shared/SocketEvents";
import { excalidrawCursorSyncController } from "../excalidrawCursor/ExcalidrawCursorSyncController";
import { ROOM_RECONNECT_GRACE_MS } from "../room/Room";
import { roomController } from "../room/RoomController";
import { questionController } from "../question/QuestionController";
import { userService } from "../user/UserService";
import { answerBarAssignmentState } from "./AnswerBarAssignmentState";

/**
 * AnswerBar の入室時割当、退出、切断猶予を処理する。
 */
export class AnswerBarController {
    /**
     * 参加先を確認後、別ルームへの所属があれば退出させてから、
     * ユーザーをルームへ参加させ、AnswerBar を割り当てる。
     *
     * @param socket 参加する Socket.IO 接続。
     * @param userId 参加するユーザー ID。
     * @param roomId 参加対象のルーム ID。
     * @returns 成功時はルーム ID、失敗時は `null`。
     */
    public joinRoom(socket: Socket, userId: number, roomId: string): string | null {
        const ownerUser = userService.getUser(userId);
        if (!ownerUser) {
            return null;
        }

        const room = roomController.getRoom(roomId);
        if (!room) {
            return null;
        }

        const previousRoomId = roomController.getRoomIdByUserId(userId);
        if (previousRoomId && previousRoomId !== roomId) {
            const removed = answerBarAssignmentState.remove(previousRoomId, userId);
            if (removed) {
                socket.nsp.to(previousRoomId).emit(SocketEvents.ANSWER_BAR_REMOVED, removed);
            }

            roomController.leaveRoom(socket, previousRoomId);
        }

        const response = roomController.joinRoom(socket, userId, roomId);
        if (!response) {
            return null;
        }

        questionController.sendCurrent(socket, roomId);

        const questionId = room.getCurrentQuestionId();
        const question = questionId === undefined ? undefined : getQuestionTemplate(questionId);
        if (!question) {
            return response;
        }

        const { assignment, isNew } = answerBarAssignmentState.getOrCreate(
            roomId,
            userId,
            ownerUser.getName(),
            question.sliders.length,
        );
        if (isNew) {
            socket.nsp.to(roomId).emit(SocketEvents.ANSWER_BAR_ADDED, assignment);
        }
        return response;
    }

    /**
     * ユーザーの AnswerBar とカーソルを削除してルームから退出させる。
     *
     * @param socket 退出する Socket.IO 接続。
     * @param userId 退出するユーザー ID。未設定の場合は退出処理を行わない。
     * @param roomId 退出対象のルーム ID。
     * @returns 成功時はルーム ID、ユーザーが未設定の場合は `null`。
     */
    public leaveRoom(socket: Socket, userId: number | undefined, roomId: string): string | null {
        if (userId === undefined) {
            return null;
        }

        const removed = answerBarAssignmentState.remove(roomId, userId);
        if (removed) {
            socket.nsp.to(roomId).emit(SocketEvents.ANSWER_BAR_REMOVED, removed);
        }

        excalidrawCursorSyncController.remove(socket);
        return roomController.leaveRoom(socket, roomId);
    }

    /**
     * 参加中ルームにある指定ユーザーの AnswerBar 所有者名を更新して通知する。
     *
     * @param socket 更新通知の送信元ソケット。
     * @param userId 更新対象のユーザー ID。
     * @param ownerUserName 更新後の所有者名。
     */
    public updateOwnerUserName(socket: Socket, userId: number, ownerUserName: string): void {
        const roomId = roomController.getRoomIdByUserId(userId);
        if (!roomId) {
            return;
        }

        const updated = answerBarAssignmentState.updateOwnerUserName(roomId, userId, ownerUserName);
        if (updated) {
            socket.nsp.to(roomId).emit(SocketEvents.ANSWER_BAR_OWNER_NAME_UPDATED, updated);
        }
    }

    /**
     * 切断したユーザーの AnswerBar を 30 秒間保留し、期限切れ時に削除する。
     *
     * ユーザーの最新 Socket ID と一致しない古い切断通知は無視する。
     *
     * @param socket 切断中の Socket.IO 接続。
     * @param userId 切断したユーザー ID。未設定の場合は処理を行わない。
     */
    public handleDisconnecting(socket: Socket, userId: number | undefined): void {
        const user = userService.getUser(userId);
        if (!user || user.getSocketId() !== socket.id) {
            return;
        }
        const disconnectedUserId = user.getId();
        const roomId = roomController.getRoomIdByUserId(disconnectedUserId);
        if (!roomId) {
            return;
        }

        const token = answerBarAssignmentState.markDisconnected(roomId, disconnectedUserId);
        if (!token) {
            return;
        }

        setTimeout(() => {
            const removed = answerBarAssignmentState.removeIfStillDisconnected(roomId, disconnectedUserId, token);
            if (!removed) {
                return;
            }

            socket.nsp.to(roomId).emit(SocketEvents.ANSWER_BAR_REMOVED, removed);
        }, ROOM_RECONNECT_GRACE_MS);
    }
}

export const answerBarController = new AnswerBarController();
