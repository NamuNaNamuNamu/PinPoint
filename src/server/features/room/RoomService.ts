import { roomLogger } from "../../logging/RoomLogger";
import { userService } from "../user/UserService";
import { Room } from "./Room";
import { roomState } from "./RoomState";

/**
 * ルームの作成、参加、退出に関するユースケースを提供する。
 */
export class RoomService {
    /**
     * 新しいルームを作成する。
     *
     * @returns 作成したルーム。
     */
    public createRoom(): Room {
        const room: Room = roomState.addRoom();
        return room;
    }

    /**
     * ユーザーを指定したルームへ参加させ、成功時にログを出力する。
     *
     * @param userId 参加するユーザー ID。
     * @param roomId 参加先のルーム ID。
     * @returns 参加に成功した場合は `true`。
     */
    public joinRoom(userId: number, roomId: string): boolean {
        const success = roomState.join(userId, roomId);

        if (success) {
            roomLogger.outputRoomState({
                event: "入室",
                userId,
                socketId:
                    userService.getUser(userId)?.getSocketId() ??
                    "userService.getUser(userId) は必ず成功する設計のため、ここには入ってこない。",
            });
        }

        return success;
    }

    /**
     * ソケット ID に対応するルーム ID を取得する。
     *
     * @param socketId 検索するソケット ID。
     * @returns ルーム ID。該当するルームがない場合は `undefined`。
     */
    public getRoomIdBySocketId(socketId: string): string | undefined {
        return roomState.getRoomIdBySocketId(socketId);
    }

    /**
     * ユーザー ID に対応するルーム ID を取得する。
     *
     * @param userId 検索するユーザー ID。
     * @returns ルーム ID。該当するルームがない場合は `undefined`。
     */
    public getRoomIdByUserId(userId: number): string | undefined {
        return roomState.getRoomIdByUserId(userId);
    }

    /**
     * ユーザーをルームから退出させ、退出ログを出力する。
     *
     * @param userId 退出するユーザー ID。
     */
    public leave(userId: number): void {
        roomState.leave(userId);

        roomLogger.outputRoomState({
            event: "退出",
            userId: userId,
            socketId: userService.getUser(userId)?.getSocketId() ?? "取得失敗しました",
        });
    }
}

export const roomService = new RoomService();
