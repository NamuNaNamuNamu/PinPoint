import type { Socket } from "socket.io";

import { socketLogger } from "../../logging/SocketLogger";
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
        roomService.leave(userId);
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
            roomService.leaveIfStillDisconnected(user.getId(), pending.token);
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
        socketLogger.outputAllSockets({
            event: `部屋退出 (roomId: ${roomId})`,
            socketId: socket.id,
        });

        return roomId;
    };
}

export const roomController = new RoomController();
