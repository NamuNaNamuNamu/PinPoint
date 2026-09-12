import { userService } from "../user/UserService";
import { Room } from "./Room";

export class RoomState {
    private rooms: Room[];

    constructor() {
        this.rooms = [];
    }

    private getRoomById(id: string): Room | undefined {
        return this.rooms.find((room) => room.getId() === id);
    }

    private getRoomBySocketId(socketId: string): Room | undefined {
        return this.rooms.find((room) => room.getSocketIds().includes(socketId));
    }

    public getRoomIdBySocketId(socketId: string): string | undefined {
        return this.getRoomBySocketId(socketId)?.getId();
    }

    public forEachRoom(callback: (room: Room) => void): void {
        this.rooms.forEach(callback);
    }

    public addRoom(): Room {
        let roomId: string;

        do {
            roomId = crypto.randomUUID();
        } while (this.getRoomById(roomId) !== undefined);

        const room: Room = new Room({ id: roomId });

        this.rooms.push(room);

        return room;
    }

    public join(userId: number, roomId: string): boolean {
        const room = this.getRoomById(roomId);

        if (!room) {
            return false;
        }

        const user = userService.getUser(userId);

        if (!user) {
            return false;
        }

        room.addUser(user);
        return true;
    }

    public leave(userId: number): void {
        for (const room of this.rooms) {
            room.removeUserById(userId);

            if (room.isEmpty()) {
                this.rooms = this.rooms.filter((r) => r.getId() !== room.getId());
            }
        }
    }
}

export const roomState = new RoomState();
