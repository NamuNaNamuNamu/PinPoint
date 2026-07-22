import type { User } from "../../../client/features/user/User";

export class RoomState {
    private rooms: Room[];

    constructor() {
        this.rooms = [];
    }

    public getRoomById(id: number): Room | undefined {
        return this.rooms.find(room => room.id === id);
    }

    public forEachRoom(callback: (room: Room) => void): void {
        this.rooms.forEach(callback);
    }

    public addRoom() {

    }
}

export interface Room {
    id: number;
    users: User[];
}

export const roomState = new RoomState();