import type { Socket } from "socket.io";

import { sliderDefinitions } from "../../../shared/Slider/sliderDefinitions";
import { SocketEvents } from "../../../shared/SocketEvents";
import { excalidrawCursorSyncController } from "../excalidrawCursor/ExcalidrawCursorSyncController";
import { roomController } from "../room/RoomController";
import { userService } from "../user/UserService";
import { answerBarAssignmentState } from "./AnswerBarAssignmentState";

/**
 * AnswerBar の入室時割当、退出、切断猶予を処理する。
 */
export class AnswerBarController {
    /**
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

        const response = roomController.joinRoom(socket, userId, roomId);
        if (!response) {
            return null;
        }

        answerBarAssignmentState.getAll(roomId).forEach((assignment) => {
            socket.emit(SocketEvents.ANSWER_BAR_ADDED, assignment);
        });

        const { assignment, isNew } = answerBarAssignmentState.getOrCreate(
            roomId,
            userId,
            ownerUser.getName(),
            sliderDefinitions.length,
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
     * @param socket 切断中の Socket.IO 接続。
     * @param userId 切断したユーザー ID。未設定の場合は処理を行わない。
     */
    public handleDisconnecting(socket: Socket, userId: number | undefined): void {
        if (userId === undefined) {
            return;
        }
        const roomId = roomController.getRoomIdByUserId(userId);
        if (!roomId) {
            return;
        }

        const token = answerBarAssignmentState.markDisconnected(roomId, userId);
        if (!token) {
            return;
        }

        setTimeout(() => {
            const removed = answerBarAssignmentState.removeIfStillDisconnected(roomId, userId, token);
            if (!removed) {
                return;
            }

            roomController.leaveUser(userId);
            socket.nsp.to(roomId).emit(SocketEvents.ANSWER_BAR_REMOVED, removed);
        }, 30_000);
    }
}

export const answerBarController = new AnswerBarController();
