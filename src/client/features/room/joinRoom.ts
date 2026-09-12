import { socketController } from "../../socket/SocketController";

export async function joinRoom(userId: number, roomId: string) {
    const response = await socketController.joinRoom(userId, roomId);

    if (response) {
        const roomId = response;
        console.log(`roooId: ${roomId} に参加しました。`);
    } else {
        console.error("部屋参加に失敗");
    }
}