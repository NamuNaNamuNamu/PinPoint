import { socketController } from "../../socket/SocketController";

export async function joinRoom(roomId: string) {
    const response = await socketController.joinRoom(roomId);

    if (response) {
        const roomId = response;
        console.log(`roooId: ${roomId} に参加しました。`);
    } else {
        console.error("部屋参加に失敗");
    }
}