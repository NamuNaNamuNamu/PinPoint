import type { JoinRoomRequest, JoinRoomResponse } from "../../../shared/room/RoomEvents";
import { socketController } from "../../socket/SocketController";
import { roomRoleStore } from "./roomRoleStore";

/**
 * Socket を通じて指定したルームへ参加し、参加結果を出力する。
 *
 * @param userId 参加するユーザーの ID。
 * @param roomId 参加するルームの ID。
 * @returns 入室先と現在ユーザーのロール。失敗時は `null`。
 */
export async function joinRoom(
    userId: number,
    roomId: string,
    recovery?: JoinRoomRequest["recovery"],
): Promise<JoinRoomResponse | null> {
    const response = await socketController.joinRoom(userId, roomId, recovery);

    if (response) {
        roomRoleStore.set(response.isCreator);
        console.log(`roooId: ${response.roomId} に参加しました。`);
    } else {
        console.error("部屋参加に失敗");
    }

    return response;
}
