export class RoomState {
    private rooms: Room[];

    constructor() {
        this.rooms = [];
    }

    public getRoomById(id: string): Room | undefined {
        return this.rooms.find(room => room.id === id);
    }

    public getRoomBySocketId(socketId: string): Room | undefined {
        return this.rooms.find(room => room.socketIds.includes(socketId));
    }

    public getRoomIdBySocketId(socketId: string): string | undefined {
        return this.getRoomBySocketId(socketId)?.id;
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
            socketIds: []
            // users: [],
        };

        this.rooms.push(room);

        return room;
    }

    public join(roomId: string, socketId: string): boolean {
        const room = this.getRoomById(roomId);

        if (!room) {
            return false;
        }

        room.socketIds.push(socketId);
        return true;
    }

    public leave(socketId: string): void {
        for (const room of this.rooms) {
            const index = room.socketIds.indexOf(socketId);

            if (index !== -1) {
                room.socketIds.splice(index, 1);

                // 部屋が空になったら削除
                if (room.socketIds.length === 0) {
                    this.rooms = this.rooms.filter(r => r.id !== room.id);
                }

                return;
            }
        }
    }
}

export interface Room {
    id: string;
    socketIds: string[];
    // users: User[]; TODO: 後ほど user と socketId を紐づける
}

export const roomState = new RoomState();