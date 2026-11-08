import type { Socket } from "socket.io";

import type { AnswerBarPositionUpdateRequest } from "../../../shared/answerBar/AnswerBarEvents";
import type { JoinRoomRequest } from "../../../shared/room/RoomEvents";
import { getQuestionTemplate } from "../../../shared/question/QuestionTemplate";
import { SocketEvents } from "../../../shared/SocketEvents";
import { excalidrawCursorSyncController } from "../excalidrawCursor/ExcalidrawCursorSyncController";
import { questionController } from "../question/QuestionController";
import { ROOM_RECONNECT_GRACE_MS } from "../room/Room";
import { roomController } from "../room/RoomController";
import { scoreState } from "../score/ScoreState";
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
     * @param recovery 再接続者が保持する AnswerBar と scene の復元候補。
     * @returns 成功時はルーム ID、失敗時は `null`。
     */
    public joinRoom(
        socket: Socket,
        userId: number,
        roomId: string,
        recovery?: JoinRoomRequest["recovery"],
    ): string | null {
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

        const disconnectedAt = answerBarAssignmentState.getDisconnectedAt(roomId, userId);
        const response = roomController.joinRoom(socket, userId, roomId);
        if (!response) {
            return null;
        }

        const questionId = room.getCurrentQuestionId();
        const question = questionId === undefined ? undefined : getQuestionTemplate(questionId);
        let didRecoverScore = false;
        if (question && !room.isCreatedBy(userId)) {
            const { assignment, isNew } = answerBarAssignmentState.getOrCreate(
                roomId,
                userId,
                ownerUser.getName(),
                question.sliders,
            );
            if (isNew) {
                socket.nsp.to(roomId).emit(SocketEvents.ANSWER_BAR_ADDED, assignment);
            }
            const afterDisconnect = (room.getAnswerRevealedAt() ?? 0) > (disconnectedAt ?? Number.MAX_SAFE_INTEGER);
            // 未公開ならローカル位置をそのまま復元する。公開済みの場合は、切断後に公開された
            // ときだけ復元を許可し、公開済みで切断した場合は server snapshot を正とする。
            if (!room.isAnswerRevealed() || afterDisconnect) {
                let recovered = false;
                recovery?.answerBarPositions.forEach((request) => {
                    if (request.answerBarId !== assignment.answerBarId) return;
                    const index = assignment.lineIds.indexOf(request.lineId);
                    const x = answerBarAssignmentState.updatePosition(
                        roomId,
                        userId,
                        request.answerBarId,
                        request.lineId,
                        request.x,
                        index < 0 ? undefined : question.sliders[index],
                    );
                    if (x !== null) {
                        recovered = true;
                        socket.nsp.to(roomId).emit(SocketEvents.ANSWER_BAR_POSITION_UPDATED, { ...request, x });
                    }
                });
                if (recovered) {
                    const scores = scoreState.replaceQuestionScore(
                        roomId,
                        question,
                        assignment,
                        answerBarAssignmentState.getPositionsByLineId(roomId),
                    );
                    socket.nsp.to(roomId).emit(SocketEvents.SCORES_UPDATED, { scores, reason: "recovered" });
                    didRecoverScore = true;
                }
            }
        }
        questionController.sendCurrent(socket, roomId, didRecoverScore ? "recovered" : "snapshot");
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
        if (scoreState.updateParticipantName(roomId, userId, ownerUserName)) {
            socket.nsp
                .to(roomId)
                .emit(SocketEvents.SCORES_UPDATED, { scores: scoreState.get(roomId), reason: "snapshot" });
        }
    }

    /**
     * 所有者からの AnswerBar 位置更新を検証し、受理した正規化済み X 座標を同一ルームへ通知する。
     *
     * 現在問題が存在しない場合、回答公開後、要求元が room 内の参加者でない場合、または
     * `AnswerBarAssignmentState` による所有者・line ID・座標の検証に失敗した場合は何もしない。
     *
     * @param socket 更新要求を受信した Socket.IO 接続。
     * @param userId 更新を要求した認証済みユーザー ID。
     * @param request AnswerBar ID、line ID、X 座標を含む位置更新要求。
     */
    public updatePosition(
        socket: Socket,
        userId: number | undefined,
        request: AnswerBarPositionUpdateRequest | undefined,
    ): void {
        if (!request || userId === undefined) {
            return;
        }
        const roomId = roomController.getRoomIdByUserId(userId);
        const room = roomId ? roomController.getRoom(roomId) : undefined;
        const questionId = room?.getCurrentQuestionId();
        const question = questionId === undefined ? undefined : getQuestionTemplate(questionId);
        if (!roomId || !room || !question || room.isAnswerRevealed() || !room.hasUser(userId)) {
            return;
        }
        const lineIndex = answerBarAssignmentState
            .getAll(roomId)
            .find((assignment) => assignment.answerBarId === request.answerBarId && assignment.ownerUserId === userId)
            ?.lineIds.indexOf(request.lineId);
        const x = answerBarAssignmentState.updatePosition(
            roomId,
            userId,
            request.answerBarId,
            request.lineId,
            request.x,
            lineIndex === undefined || lineIndex < 0 ? undefined : question.sliders[lineIndex],
        );
        if (x !== null) {
            socket.nsp.to(roomId).emit(SocketEvents.ANSWER_BAR_POSITION_UPDATED, { ...request, x });
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
