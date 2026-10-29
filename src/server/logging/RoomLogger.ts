import { Room } from "../features/room/Room";
import { roomState } from "../features/room/RoomState";

class RoomLogger {
    /**
     * ルームの状態をイベント情報とともに標準出力へ記録する。
     *
     * @param props 発生イベント、ユーザー ID、Socket ID。
     */
    outputRoomState({ event, userId, socketId }: Props) {
        console.log("===== RoomState =====");
        console.log(`イベント: ${event}`);
        console.log(`userId: ${userId}`);
        console.log(`socketId: ${socketId}`);

        roomState.forEachRoom((room: Room): void => {
            console.log(room);
        });

        console.log("=============\n");
    }
}

/**
 * ルーム状態を記録するイベントの情報。
 */
type Props = {
    event: string;
    userId: number;
    socketId: string;
};

export const roomLogger = new RoomLogger();
