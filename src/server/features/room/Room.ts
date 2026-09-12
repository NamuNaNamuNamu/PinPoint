import type { User } from "../user/User";

export class Room {
    private id: string;
    private users: User[] = [];

    constructor(params: RoomParams) {
        this.id = params.id;
    }

    public getId(): string {
        return this.id;
    }

    public addUser(user: User): void {
        this.users.push(user);
    }

    public removeUserById(userId: number): void {
        this.users = this.users.filter((user) => user.getId() !== userId);
    }

    public getSocketIds(): string[] {
        return this.users.map((user) => user.getSocketId());
    }

    public isEmpty(): boolean {
        return this.users.length === 0;
    }
}

interface RoomParams {
    id: string;
}
