export class User {
    private id: number;
    private name: string;
    private socketId: string;

    constructor(params: UserParams) {
        this.id = params.id;
        this.name = params.name;
        this.socketId = params.socketId;
    }

    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getSocketId(): string {
        return this.socketId;
    }
}

interface UserParams {
    id: number;
    name: string;
    socketId: string;
}