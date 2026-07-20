import type { User } from "../../../App/User/User";

export class UserState {
    private users: User[];

    constructor() {
        this.users = [];
    }

    public getUserById(id: number): User | undefined {
        return this.users.find(user => user.getId() === id);
    }

    public forEachRoom(callback: (user: User) => void): void {
            this.users.forEach(callback);
        }

    public addUser(user: User): void {
        this.users.push(user);
    }
}

export const userState = new UserState();