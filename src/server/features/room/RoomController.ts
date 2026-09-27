import type { Socket } from "socket.io";
import { socketLogger } from "../../logging/SocketLogger";
import { Room } from "./Room";
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
    public createRoom = (): Room => {
        return roomService.createRoom();
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
}

export const roomController = new RoomController();
