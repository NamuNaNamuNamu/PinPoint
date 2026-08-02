import type { User } from "../user/User";

export class RoomState {
    private rooms: Room[];

    constructor() {
        this.rooms = [];
    }

    public getRoomById(id: string): Room | undefined {
        return this.rooms.find(room => room.id === id);
    }

    public forEachRoom(callback: (room: Room) => void): void {
        this.rooms.forEach(callback);
    }

    public addRoom(): Room {
        let roomId: string;

        do {
            roomId = crypto.randomUUID();
        } while (this.getRoomById(roomId) !== undefined);

        const room: Room = {
            id: roomId,
            users: [],
        };

        this.rooms.push(room);

        return room;
    }
}

export interface Room {
    id: string;
    users: User[];
}

export const roomState = new RoomState();