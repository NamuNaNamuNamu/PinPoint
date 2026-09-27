import { socketController } from "../../socket/SocketController";

/**
 * Socket を通じて指定したルームへ参加し、参加結果を出力する。
 *
 * @param userId 参加するユーザーの ID。
 * @param roomId 参加するルームの ID。
 */
export async function joinRoom(userId: number, roomId: string) {
    const response = await socketController.joinRoom(userId, roomId);

    if (response) {
        const roomId = response;
        console.log(`roooId: ${roomId} に参加しました。`);
    } else {
        console.error("部屋参加に失敗");
    }
}
