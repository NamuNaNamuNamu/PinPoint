import { Room } from "../features/room/Room";
import { roomState } from "../features/room/RoomState";

class RoomLogger {
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

type Props = {
    event: string;
    userId: number;
    socketId: string;
};

export const roomLogger = new RoomLogger();
