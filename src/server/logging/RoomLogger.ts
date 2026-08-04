import type { Room, RoomState } from "../features/room/RoomState";

class RoomLogger {
    outputRoomState(roomstate: RoomState) {
        console.log("===== RoomState =====");

        roomstate.forEachRoom((room: Room): void => {
            console.log(room);
        });
        
        console.log("=============\n");
    }
}

export const roomLogger = new RoomLogger();