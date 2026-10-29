import type { Socket } from "socket.io";

import { SocketEvents } from "../../../shared/SocketEvents";
import { socketLogger } from "../../logging/SocketLogger";
import { scoreState } from "../score/ScoreState";
import { userService } from "../user/UserService";
import { Room, ROOM_RECONNECT_GRACE_MS } from "./Room";
import { roomService } from "./RoomService";

/**
 * Socket を受け取り、ルームに関する操作を処理する。
 */
class RoomController {
    /**
     * 新しいルームを作成する。
     *
     * @returns 作成したルーム。
     */
    public createRoom = (creatorUserId: number): Room => {
        return roomService.createRoom(creatorUserId);
    };

    /**
     * 指定 ID のルームを取得する。
     *
     * @param roomId 取得対象のルーム ID。
     * @returns 対応するルーム。存在しない場合は `undefined`。
     */
    public getRoom = (roomId: string): Room | undefined => {
        return roomService.getRoom(roomId);
    };

    /**
     * ユーザーを指定したルームに参加させ、成功時には Socket.IO のルームにも参加させる。
     *
     * @param socket 参加するクライアントのソケット。
     * @param userId 参加するユーザー ID。
     * @param roomId 参加先のルーム ID。
     * @returns 成功時はルーム ID、失敗時は `null`。
     */
    public joinRoom = (socket: Socket, userId: number, roomId: string): string | null => {
        const success = roomService.joinRoom(userId, roomId);

        if (success) {
            socket.join(roomId);
            this.addScoreParticipant(socket, userId, roomId);
            socketLogger.outputAllSockets({
                event: "部屋参加",
                socketId: socket.id,
            });
        }

        return success ? roomId : null;
    };

    /**
     * ソケットが参加しているルーム ID を取得する。
     *
     * @param socket ルームを検索するソケット。
     * @returns ルーム ID。参加していない場合は `undefined`。
     */
    public getRoomId = (socket: Socket): string | undefined => {
        return roomService.getRoomIdBySocketId(socket.id);
    };

    /**
     * ユーザー ID に対応するルーム ID を取得する。
     *
     * @param userId 検索するユーザー ID。
     * @returns ルーム ID。所属していない場合は `undefined`。
     */
    public getRoomIdByUserId = (userId: number): string | undefined => {
        return roomService.getRoomIdByUserId(userId);
    };

    /**
     * ユーザーをルームから退出させる。
     *
     * Socket.IO の退出操作を伴わない切断猶予期限の処理から使用する。
     *
     * @param userId 退出するユーザー ID。
     */
    public leaveUser = (userId: number): void => {
        const roomId = roomService.getRoomIdByUserId(userId);
        roomService.leave(userId);
        if (roomId) {
            scoreState.removeParticipant(roomId, userId);
        }
    };

    /**
     * 接続 ID が現在のユーザーに対応している場合だけ、30 秒間の再接続猶予を開始する。
     *
     * @param socket 切断中の Socket.IO 接続。
     * @param userId 切断したユーザー ID。
     */
    public handleDisconnecting = (socket: Socket, userId: number | undefined): void => {
        const user = userService.getUser(userId);
        if (!user || user.getSocketId() !== socket.id) {
            return;
        }
        const pending = roomService.markDisconnected(user.getId());
        if (!pending) {
            return;
        }
        setTimeout(() => {
            const roomId = roomService.leaveIfStillDisconnected(user.getId(), pending.token);
            if (roomId) {
                this.removeScoreParticipant(socket, roomId, user.getId());
            }
        }, ROOM_RECONNECT_GRACE_MS);
    };

    /**
     * ユーザーを指定したルームから退出させ、Socket.IO のルームからも退出させる。
     *
     * @param socket 退出するクライアントのソケット。
     * @param roomId 退出するルーム ID。
     * @returns 成功時はルーム ID、ユーザーが見つからない場合は `null`。
     */
    public leaveRoom = (socket: Socket, roomId: string): string | null => {
        const user = userService.getUserBySocketId(socket.id);
        if (!user) {
            return null;
        }

        roomService.leave(user.getId());
        socket.leave(roomId);
        this.removeScoreParticipant(socket, roomId, user.getId());
        socketLogger.outputAllSockets({
            event: `部屋退出 (roomId: ${roomId})`,
            socketId: socket.id,
        });

        return roomId;
    };

    /**
     * 入室成功後、非作成者を得点一覧の表示対象へ追加して参加者へ通知する。
     *
     * @param socket 入室した Socket.IO 接続。
     * @param userId 入室したユーザー ID。
     * @param roomId 入室先ルーム ID。
     */
    private addScoreParticipant(socket: Socket, userId: number, roomId: string): void {
        const room = roomService.getRoom(roomId);
        const user = userService.getUser(userId);
        if (!room || !user || room.isCreatedBy(userId)) {
            return;
        }
        if (scoreState.addParticipant(roomId, userId, user.getName())) {
            socket.nsp
                .to(roomId)
                .emit(SocketEvents.SCORES_UPDATED, { scores: scoreState.get(roomId), reason: "snapshot" });
        }
    }

    /**
     * 退出した非作成者を得点一覧の表示対象から除外して残留参加者へ通知する。
     *
     * @param socket 退出に使用した Socket.IO 接続。
     * @param roomId 退出元ルーム ID。
     * @param userId 退出したユーザー ID。
     */
    private removeScoreParticipant(socket: Socket, roomId: string, userId: number): void {
        if (scoreState.removeParticipant(roomId, userId)) {
            socket.nsp
                .to(roomId)
                .emit(SocketEvents.SCORES_UPDATED, { scores: scoreState.get(roomId), reason: "snapshot" });
        }
    }
}

export const roomController = new RoomController();
