import { roomLogger } from "../../logging/RoomLogger";
import { userService } from "../user/UserService";
import { Room } from "./Room";
import { roomState } from "./RoomState";

export class RoomService {
    public createRoom(): Room {
        const room: Room = roomState.addRoom();
        return room;
    }

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

    public getRoomIdBySocketId(socketId: string): string | undefined {
        return roomState.getRoomIdBySocketId(socketId);
    }

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
